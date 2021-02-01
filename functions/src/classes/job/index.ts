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
    readonly status?: JobStatus | undefined,
    readonly id?: string,
  ) { }

  static getConverter(): admin.firestore.FirestoreDataConverter<Job> {
    return {
      toFirestore({ owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, status, id }: Job): admin.firestore.DocumentData {
        return { owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, status, id };
      },
      fromFirestore(
        snapshot: admin.firestore.QueryDocumentSnapshot<Job>
      ): Job {
        const { owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, status, id } = snapshot.data();

        return new Job(owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, status, id);
      },
    }
  }

  static getJobs(): Promise<FirebaseFirestore.QuerySnapshot<IJob>> {
    return admin
      .firestore()
      .collection('jobs')
      .withConverter(this.getConverter())
      .where('status', '==', JobStatus.PENDING)
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

    await this.transferFunds(job, rider_doc_data);

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

    job.rider_id = '';
    job.status = JobStatus.PENDING;
    job.owner_id = owner_id;
    job.owner_name = business_data.name;
    job.pickup_location = new admin.firestore.GeoPoint(job.pickup_location.latitude, job.pickup_location.longitude);
    job.customer_location = new admin.firestore.GeoPoint(job.customer_location.latitude, job.customer_location.longitude);

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

    const payment_intent = await Job.createPaymentIntent(job_doc_data, owner_doc_data);

    if (payment_intent.last_payment_error) {
      const job_data_doc = await Job.getJob(job.id);
      const d = job_data_doc.data();

      if (d && d.id) {
        await Job.updateJob(d.id, { status: JobStatus.REFUNDED }); // Change to delete
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

  private static async transferFunds(job: IJob, rider_doc: User) {
    const remoteConfig = admin.remoteConfig();
    const config = await remoteConfig.getTemplate();

    const fee = Number((<any>config.parameters.application_fee.defaultValue).value);

    const APPLICATION_FEE = Math.floor(fee * job.cost / 100 + 20);

    if (rider_doc && rider_doc.id) {
      return stripe.transfers.create({
        amount: job.cost - APPLICATION_FEE,
        destination: rider_doc.id,
        currency: 'gbp',
      });
    } else {
      return;
    }
  }

  private static async createPaymentIntent(job: IJob, owner_doc: User) {
    const stripe_customer_object: any = await stripe.customers.retrieve(owner_doc.customer_id);

    return stripe.paymentIntents.create({
      amount: job.cost,
      payment_method_types: [ 'card' ],
      payment_method: stripe_customer_object.invoice_settings.default_payment_method,
      confirm: true,
      customer: owner_doc.customer_id,
      currency: 'gbp', // This will need to be dynamic based on account location
      off_session: true,
    });
  }
}
