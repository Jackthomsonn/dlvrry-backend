import { User } from './../user/index';
import { Crud } from './../base/index';
import { Payment } from './../payment/index';
import { Unauthorized } from './../../errors/unauthorized';
import * as admin from 'firebase-admin';

import { JobNotFound } from './../../errors/jobNotFound';
import { JobTaken } from './../../errors/jobTaken';
import Stripe from 'stripe';
import { UserNotFound } from './../../errors/userNotFound';
import { IJob, IUser, JobStatus } from 'dlvrry-common';
import * as geocoder from 'node-geocoder';
import moment = require('moment');
import * as functions from 'firebase-functions';

export class Job extends Crud<IJob> {
  private user = new User();

  constructor() {
    super('jobs');
  }

  async completeJob(job: IJob, token: admin.auth.DecodedIdToken) {
    if (!job.id) {
      throw new JobNotFound();
    }

    const job_doc = await this.get(job.id);
    const job_doc_data = job_doc.data();

    if (!job_doc_data?.rider_id) {
      throw new UserNotFound();
    }

    const rider_doc = await this.user.get(job_doc_data.rider_id);
    const rider_doc_data = rider_doc.data();

    if (!rider_doc_data) {
      throw new UserNotFound();
    }

    if (token.uid !== rider_doc_data.id) {
      throw new Unauthorized();
    }

    const owner_doc = await this.user.get(job_doc_data.owner_id);
    const owner_doc_data = owner_doc.data();

    if (!owner_doc_data) {
      throw new UserNotFound();
    }

    await Payment.transferFunds(job_doc_data, rider_doc_data);

    return await this.update(job.id, { id: job.id, status: JobStatus.COMPLETED });
  }

  async createJob(job: IJob, owner_id: string) {
    try {
      const business = await this.user.get(owner_id);
      const business_data = business.data();

      if (!business_data) {
        throw new UserNotFound();
      }

      const payout = await this.calculateFee(job.cost);

      this.constructJobObject(
        job,
        await this.getLocationName(job.customer_location.latitude, job.customer_location.longitude),
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
        .create(job)

      const job_doc = await this.get(job.id);
      const job_doc_data = job_doc.data();

      if (!job_doc_data) {
        throw new JobNotFound();
      }

      const owner_doc = await this.user.get(job_doc_data.owner_id);
      const owner_doc_data = owner_doc.data();

      if (!owner_doc_data) {
        throw new UserNotFound();
      }

      const paymentIntent = await Payment.create(job_doc_data, owner_doc_data);

      await this.update(job.id, { charge_id: paymentIntent.charges.data[ 0 ].id, payment_captured: true, status: JobStatus.PENDING });

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
          await this.update(job.id, {
            ...update_doc,
            complete_payment_link: e.payment_intent.client_secret,
            complete_payment_method_link: e.payment_method?.id,
          });
        } else {
          await this.update(job.id, { ...update_doc });
        }

        return Promise.resolve({
          completed: false,
          client_secret: e.payment_intent?.client_secret,
          payment_method_id: e.payment_intent?.last_payment_error?.payment_method?.id,
        });
      } else {
        // Set status to payment_error
        await this.update(job.id, { charge_id: '', payment_captured: false, status: JobStatus.CANCELLED_BY_OWNER });

        return Promise.reject({
          completed: false,
          message: e.message,
        })
      }
    }
  }

  async acceptJob(id: string, rider_id: string): Promise<admin.firestore.WriteResult> {
    try {
      const job_doc = await this.get(id);
      const job_doc_data = job_doc.data();

      if (!job_doc_data) {
        throw new JobNotFound();
      }

      if (job_doc_data.status === JobStatus.IN_PROGRESS) {
        throw new JobTaken();
      }

      return await this
        .update(job_doc_data.id, {
          status: JobStatus.IN_PROGRESS,
          rider_id: rider_id,
        });
    } catch (e) {
      throw e;
    }
  }

  async cancelJob(id: string, token: admin.auth.DecodedIdToken) {
    const job = await this.get(id);
    const user = await this.user.get(token.uid);
    const job_doc_data = job.data();
    const user_doc_data = user.data();

    if (!job_doc_data) {
      throw new JobNotFound();
    }

    if (!user_doc_data) {
      throw new UserNotFound();
    }

    if (token.uid === job_doc_data.owner_id) {
      await this.update(id, { status: JobStatus.CANCELLED_BY_OWNER });

      return Promise.resolve();
    } else if (token.uid === job_doc_data.rider_id) {
      const rider_id = job_doc_data.rider_id;

      await this.update(id, { status: JobStatus.CANCELLED_BY_RIDER });

      await this.user.update(rider_id, { cancelled_jobs: (user_doc_data.cancelled_jobs || 0) + 1 });

      return Promise.resolve();
    } else {
      throw new Unauthorized();
    }
  }

  async calculateFee(cost: number) {
    const remoteConfig = await admin.remoteConfig().getTemplate();
    const feePercent = (<any>remoteConfig.parameters.application_fee.defaultValue).value;
    const flatFee = (<any>remoteConfig.parameters.flat_fee.defaultValue).value;

    const amountAfterPayoutFee = cost - Math.floor((cost / 100) * Number(feePercent) + Number(flatFee));

    return Promise.resolve(Number(amountAfterPayoutFee.toFixed(0)));
  }

  async getLocationName(lat: number, lon: number) {
    const geocode = geocoder({
      provider: 'google',
      apiKey: functions.config().dlvrry.g_api_key,
    });

    return geocode.reverse({ lat, lon });
  }

  constructJobObject(job: IJob, locationName: geocoder.Entry[], owner_id: string, business_data: IUser, payout: number) {
    job.customer_location_name = `${ locationName[ 0 ].streetNumber }, ${ locationName[ 0 ].streetName }`;
    job.status = JobStatus.AWAITING_PAYMENT;
    job.owner_id = owner_id;
    job.owner_name = business_data.name;
    job.pickup_location = new admin.firestore.GeoPoint(job.pickup_location.latitude, job.pickup_location.longitude);
    job.customer_location = new admin.firestore.GeoPoint(job.customer_location.latitude, job.customer_location.longitude);
    job.payment_captured = false;
    job.payout = payout;
    job.created = moment().toISOString();
  }
}
