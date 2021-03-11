import { Payment } from './../payment/index';
import { Unauthorized } from './../../errors/unauthorized';
import * as admin from 'firebase-admin';

import { JobNotFound } from './../../errors/jobNotFound';
import { JobTaken } from './../../errors/jobTaken';
import Stripe from 'stripe';
import { User } from './../user/index';
import { UserNotFound } from './../../errors/userNotFound';
import { IJob, JobStatus } from 'dlvrry-common';
import * as geocoder from 'node-geocoder';
import moment = require('moment');
import * as functions from 'firebase-functions';

export class Job implements IJob {
  constructor(
    readonly created: string,
    readonly owner_name: string,
    readonly owner_id: string,
    readonly rider_id: string,
    readonly customer_location: admin.firestore.GeoPoint,
    readonly pickup_location: admin.firestore.GeoPoint,
    readonly number_of_items: number,
    readonly payout: number,
    readonly cost: number,
    readonly customer_location_name: string,
    readonly payment_captured: boolean,
    readonly complete_payment_link?: string,
    readonly complete_payment_method_link?: string,
    readonly status?: JobStatus | undefined,
    readonly id?: string,
    readonly charge_id?: string,
  ) { }

  static getConverter(): admin.firestore.FirestoreDataConverter<Job> {
    return {
      toFirestore(job: Job): admin.firestore.DocumentData { return job },
      fromFirestore(snapshot: admin.firestore.QueryDocumentSnapshot<Job>) { return snapshot.data() },
    }
  }

  static getJobs(whereField: any, whereOp: any, whereValue: any): Promise<FirebaseFirestore.QuerySnapshot<IJob>> {
    return admin
      .firestore()
      .collection('jobs')
      .withConverter(this.getConverter())
      .where((whereField && whereOp && whereValue) ?? 'status', '==', JobStatus.PENDING)
      .get()
  }

  static getJob(id: string): Promise<FirebaseFirestore.DocumentSnapshot<IJob>> {
    return admin
      .firestore()
      .collection('jobs')
      .withConverter(this.getConverter())
      .doc(id)
      .get();
  }

  static async completeJob(job: IJob, token: admin.auth.DecodedIdToken) {
    if (!job.id) {
      throw new JobNotFound();
    }

    const job_doc = await Job.getJob(job.id);
    const job_doc_data = job_doc.data();

    if (!job_doc_data) {
      throw new JobNotFound();
    }

    const rider_doc = await User.getUser(job_doc_data.rider_id);
    const rider_doc_data = rider_doc.data();

    if (!rider_doc_data) {
      throw new UserNotFound();
    }

    if (token.uid !== rider_doc_data.id) {
      throw new Unauthorized();
    }

    const owner_doc = await User.getUser(job_doc_data.owner_id);
    const owner_doc_data = owner_doc.data();

    if (!owner_doc_data) {
      throw new UserNotFound();
    }

    await Payment.transferFunds(job_doc_data, rider_doc_data);

    return await Job.updateJob(job.id, { id: job.id, status: JobStatus.COMPLETED });
  }

  static async updateJob(id: string, job: Partial<IJob>): Promise<admin.firestore.WriteResult> {
    return await admin
      .firestore()
      .collection('jobs')
      .withConverter(Job.getConverter())
      .doc(id)
      .update(job);
  }

  static async createJob(job: IJob, owner_id: string) {
    try {
      const business = await User.getUser(owner_id);
      const business_data = business.data();

      if (!business_data) {
        throw new UserNotFound();
      }

      const payout = await this.calculateFee(job.cost);

      Job.constructJobObject(
        job,
        await Job.getLocationName(job.customer_location.latitude, job.customer_location.longitude),
        owner_id,
        business_data,
        payout
      );

      const doc = admin
        .firestore()
        .collection('jobs')
        .doc();

      job.id = doc.id;

      await doc
        .withConverter(Job.getConverter())
        .create(job)

      const job_doc = await Job.getJob(job.id);
      const job_doc_data = job_doc.data();

      if (!job_doc_data) {
        throw new JobNotFound();
      }

      const owner_doc = await User.getUser(job_doc_data.owner_id);
      const owner_doc_data = owner_doc.data();

      if (!owner_doc_data) {
        throw new UserNotFound();
      }

      const paymentIntent = await Payment.create(job_doc_data, owner_doc_data);

      await Job.updateJob(job.id, { charge_id: paymentIntent?.charges.data[ 0 ].id, payment_captured: true, status: JobStatus.PENDING });

      return Promise.resolve({
        completed: true,
      });
    } catch (e) {
      if (e instanceof Stripe.errors.StripeCardError) {
        const update_doc = {
          charge_id: e.payment_intent?.charges.data[ 0 ].id,
          payment_captured: false,
          status: JobStatus.AWAITING_PAYMENT,
        }

        if (e?.payment_intent?.client_secret && e?.payment_method?.id) {
          await Job.updateJob(<string>job.id, {
            ...update_doc,
            complete_payment_link: e.payment_intent.client_secret,
            complete_payment_method_link: e.payment_method?.id,
          });
        } else {
          await Job.updateJob(<string>job.id, { ...update_doc });
        }

        return Promise.resolve({
          completed: false,
          client_secret: e.payment_intent?.client_secret,
          payment_method_id: e.payment_intent?.last_payment_error?.payment_method?.id,
        });
      } else {
        // Set status to payment_error
        await Job.updateJob(<string>job.id, { charge_id: '', payment_captured: false, status: JobStatus.CANCELLED_BY_OWNER });

        return Promise.reject({
          completed: false,
          message: e.message,
        })
      }
    }
  }

  static async acceptJob(id: string, rider_id: string): Promise<admin.firestore.WriteResult> {
    try {
      const jobDoc = admin
        .firestore()
        .collection('jobs')
        .withConverter(this.getConverter())
        .doc(id);

      const jobDocData = await jobDoc.get();

      if (jobDocData.data()?.status === JobStatus.IN_PROGRESS) {
        throw new JobTaken();
      }

      return await jobDoc
        .update({
          status: JobStatus.IN_PROGRESS,
          rider_id: rider_id,
        });
    } catch (e) {
      throw e;
    }
  }

  static async cancelJob(id: string, token: admin.auth.DecodedIdToken) {
    const job = await Job.getJob(id);
    const user = await User.getUser(token.uid);
    const job_data = job.data();
    const user_data = user.data();

    if (token.uid === job_data?.owner_id) {
      await Job.updateJob(id, { status: JobStatus.CANCELLED_BY_OWNER });

      return Promise.resolve();
    } else if (token.uid === job_data?.rider_id) {
      const rider_id = job_data?.rider_id;

      if (!rider_id) {
        throw new UserNotFound();
      }

      await Job.updateJob(id, { status: JobStatus.CANCELLED });

      if (user_data?.cancelled_jobs) {
        await User.updateUser(rider_id, { cancelled_jobs: user_data?.cancelled_jobs + 1 });

        return Promise.resolve();
      }
    } else {
      throw new Unauthorized();
    }
  }

  private static async calculateFee(cost: number) {
    const remoteConfig = await admin.remoteConfig().getTemplate();
    const feePercent = (<any>remoteConfig.parameters.application_fee.defaultValue).value;
    const flatFee = (<any>remoteConfig.parameters.flat_fee.defaultValue).value;

    const amountAfterPayoutFee = cost - Math.floor((cost / 100) * Number(feePercent) + Number(flatFee));

    return Promise.resolve(Number(amountAfterPayoutFee.toFixed(0)));
  }

  private static async getLocationName(lat: number, lon: number) {
    const geocode = geocoder({
      provider: 'google',
      apiKey: functions.config().dlvrry.g_api_key,
    });

    return geocode.reverse({ lat, lon });
  }

  private static constructJobObject(job: IJob, locationName: geocoder.Entry[], owner_id: string, business_data: User, payout: number) {
    job.customer_location_name = `${ locationName[ 0 ].streetNumber }, ${ locationName[ 0 ].streetName }`;
    job.rider_id = '';
    job.status = JobStatus.AWAITING_PAYMENT;
    job.owner_id = owner_id;
    job.owner_name = business_data.name;
    job.pickup_location = new admin.firestore.GeoPoint(job.pickup_location.latitude, job.pickup_location.longitude);
    job.customer_location = new admin.firestore.GeoPoint(job.customer_location.latitude, job.customer_location.longitude);
    job.charge_id = '';
    job.payment_captured = false;
    job.payout = payout;
    job.created = moment().toISOString();
  }
}
