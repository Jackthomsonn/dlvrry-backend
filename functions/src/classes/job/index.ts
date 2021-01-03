import * as admin from 'firebase-admin';
import { IJob, JobStatus } from '@dlvrry/dlvrry-common';
import Stripe from 'stripe';
import { User } from './../user/index';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export class Job implements IJob {
  readonly id: string = '';

  constructor(
    readonly owner_name: string,
    readonly owner_id: string,
    readonly rider_id: string,
    readonly customer_location: admin.firestore.GeoPoint,
    readonly pickup_location: admin.firestore.GeoPoint,
    readonly number_of_items: number,
    readonly payout: number,
    readonly status: JobStatus,
    readonly cost: number
  ) { }

  static getConverter(): admin.firestore.FirestoreDataConverter<Job> {
    return {
      toFirestore({ customer_location, pickup_location, number_of_items, payout, status, cost }: Job): admin.firestore.DocumentData {
        return { customer_location, pickup_location, number_of_items, payout, status, cost };
      },
      fromFirestore(
        snapshot: admin.firestore.QueryDocumentSnapshot<Job>
      ): Job {
        const { owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, status, cost } = snapshot.data();

        return new Job(owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, status, cost);
      }
    }
  }

  static getJobs(): Promise<Job[]> {
    return new Promise(resolve => {
      admin
        .firestore()
        .collection('jobs')
        .withConverter(this.getConverter())
        .where('status', '==', JobStatus.PENDING)
        .onSnapshot(async (response) => {
          const collection = [];

          for (const job of response.docs) {
            collection.push(job.data());
          }

          resolve(collection);
        });
    });
  }

  static getJob(id: string): Promise<Job> {
    return new Promise<any>(resolve => {
      admin
        .firestore()
        .collection('jobs')
        .doc(id)
        .withConverter(this.getConverter())
        .onSnapshot(response => {
          resolve(response.data());
        });
    });
  }

  static async completeJob(job: IJob) {
    const job_doc = await Job.getJob(job.id);
    const rider_doc = await User.getUser(job_doc.rider_id);
    const owner_doc = await User.getUser(job_doc.owner_id);

    await Job.createPaymentIntent(job, rider_doc, owner_doc);

    return await Job.updateJob(job.id, { id: job.id, status: JobStatus.COMPLETED });
  }

  static async updateJob(id: string, job: Partial<IJob>): Promise<admin.firestore.WriteResult> {
    return await admin
      .firestore()
      .collection('jobs')
      .doc(id)
      .update(job);
  }

  static async createJob(job: IJob, owner_id: string): Promise<FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>> {
    const business = await User.getUser(owner_id);

    job.status = JobStatus.PENDING;
    job.owner_id = owner_id;
    job.owner_name = business.name;
    job.pickup_location = new admin.firestore.GeoPoint(50.440941, 50.440941);
    job.customer_location = new admin.firestore.GeoPoint(50.44437, -4.76287);

    return await admin
      .firestore()
      .collection('jobs')
      .withConverter(this.getConverter())
      .add(job);
  }

  private static async createPaymentIntent(job: IJob, rider_doc: User, owner_doc: User) {
    const remoteConfig = admin.remoteConfig();
    const config = await remoteConfig.getTemplate();

    const fee = Number((<any>config.parameters.application_fee.defaultValue).value);

    const APPLICATION_FEE = Math.floor(fee * job.cost / 100 + 20);
    const stripe_customer_object: any = await stripe.customers.retrieve(owner_doc.customer_id);

    return stripe.paymentIntents.create({
      amount: job.cost,
      application_fee_amount: APPLICATION_FEE,
      payment_method_types: [ 'card' ],
      payment_method: stripe_customer_object.invoice_settings.default_payment_method,
      confirm: true,
      customer: owner_doc.customer_id,
      currency: 'gbp', // This will need to be dynamic based on account location
      transfer_data: {
        destination: rider_doc.connected_account_id
      },
    });
  }
}
