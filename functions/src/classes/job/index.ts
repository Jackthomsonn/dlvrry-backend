import * as admin from 'firebase-admin';

import { IJob, JobStatus } from 'dlvrry-common';

import { JobNotFound } from './../../errors/jobNotFound';
import { JobTaken } from './../../errors/jobTaken';
import Stripe from 'stripe';
import { User } from './../user/index';
import { UserNotFound } from './../../errors/userNotFound';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export class Job implements IJob {
  constructor(
    readonly owner_name: string,
    readonly owner_id: string,
    readonly rider_id: string,
    readonly customer_location: admin.firestore.GeoPoint,
    readonly pickup_location: admin.firestore.GeoPoint,
    readonly number_of_items: number,
    readonly payout: number,
    readonly cost: number,
    readonly payment_captured: boolean,
    readonly status?: JobStatus | undefined,
    readonly id?: string,
    readonly charge_id?: string,
  ) { }

  static getConverter(): admin.firestore.FirestoreDataConverter<Job> {
    return {
      toFirestore({ owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, payment_captured, status, id, charge_id }: Job): admin.firestore.DocumentData {
        return { owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, payment_captured, status, id, charge_id };
      },
      fromFirestore(
        snapshot: admin.firestore.QueryDocumentSnapshot<Job>
      ): Job {
        const { owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, payment_captured, status, id, charge_id } = snapshot.data();

        return new Job(owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, payment_captured, status, id, charge_id);
      },
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

  static async completeJob(job: IJob) {
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

    const owner_doc = await User.getUser(job_doc_data.owner_id);
    const owner_doc_data = owner_doc.data();

    if (!owner_doc_data) {
      throw new UserNotFound();
    }

    await this.transferFunds(job_doc_data, rider_doc_data);

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
    const business = await User.getUser(owner_id);
    const business_data = business.data();

    if (!business_data) {
      throw new UserNotFound();
    }

    const payout = await this.calculateFee(job.cost);

    job.rider_id = '';
    job.status = JobStatus.AWAITING_PAYMENT;
    job.owner_id = owner_id;
    job.owner_name = business_data.name;
    job.pickup_location = new admin.firestore.GeoPoint(job.pickup_location.latitude, job.pickup_location.longitude);
    job.customer_location = new admin.firestore.GeoPoint(job.customer_location.latitude, job.customer_location.longitude);
    job.charge_id = '';
    job.payment_captured = false;
    job.payout = payout;

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


    try {
      const paymentIntent = await Job.createPayment(job_doc_data, owner_doc_data);

      await Job.updateJob(job.id, { charge_id: paymentIntent?.charges.data[ 0 ].id, payment_captured: true, status: JobStatus.PENDING });

      return Promise.resolve({
        completed: true,
      });
    } catch (e) {
      if (e instanceof Stripe.errors.StripeCardError) {
        await Job.updateJob(job.id, { charge_id: e.payment_intent?.charges.data[ 0 ].id, payment_captured: false, status: JobStatus.AWAITING_PAYMENT });

        return Promise.resolve({
          completed: false,
          client_secret: e.payment_intent?.client_secret,
          payment_method_id: e.payment_intent?.last_payment_error?.payment_method?.id,
        });
      }

      return;
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
    } else {
      const rider_id = job_data?.rider_id;

      if (!rider_id) {
        throw new UserNotFound();
      }

      await Job.updateJob(id, { status: JobStatus.CANCELLED });

      if (user_data?.cancelled_jobs) {
        await User.updateUser(rider_id, { cancelled_jobs: user_data?.cancelled_jobs + 1 });

        return Promise.resolve();
      }

      return Promise.resolve();
    }
  }

  private static async transferFunds(job: IJob, rider_doc: User) {
    if (rider_doc && rider_doc.id) {
      await stripe.transfers.create({
        source_transaction: job.charge_id,
        currency: 'gbp',
        amount: job.payout,
        destination: rider_doc.connected_account_id,
      });
    }

    return;
  }

  private static async createPayment(job: IJob, owner_doc: User) {
    const stripe_customer: any = await stripe.customers.retrieve(owner_doc.customer_id);
    const customer = <Stripe.Customer>stripe_customer;

    if (customer?.invoice_settings?.default_payment_method) {
      return stripe.paymentIntents.create({
        amount: job.cost,
        payment_method: <string>customer.invoice_settings.default_payment_method,
        customer: owner_doc.customer_id,
        currency: 'gbp',
        confirm: true,
        off_session: true,
        metadata: {
          id: job?.id || '',
        },
      });
    }

    return;
  }

  private static async calculateFee(cost: number) {
    const remoteConfig = await admin.remoteConfig().getTemplate();
    const feePercent = (<any>remoteConfig.parameters.application_fee.defaultValue).value;
    const flatFee = (<any>remoteConfig.parameters.flat_fee.defaultValue).value;

    const amountAfterPayoutFee = cost - Math.floor((cost / 100) * Number(feePercent) + Number(flatFee));

    return Promise.resolve(Number(amountAfterPayoutFee.toFixed(0)));
  }
}
