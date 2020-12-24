import * as admin from 'firebase-admin';

import { IJob } from '../../interfaces/IJob';
import { IUser } from './../../interfaces/IUser';
import { Status } from '../../enums/status/index';
import Stripe from 'stripe';
const percentage = require('calculate-percentages');

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export class Job implements IJob {
  readonly id: string = '';

  constructor(
    readonly businessName: string,
    readonly businessId: string,
    readonly driverId: string,
    readonly customerLocation: admin.firestore.GeoPoint,
    readonly pickupLocation: admin.firestore.GeoPoint,
    readonly numberOfItems: number,
    readonly payout: number,
    readonly status: Status,
    readonly cost: number
  ) { }

  static getConverter(): admin.firestore.FirestoreDataConverter<Job> {
    return {
      toFirestore({ customerLocation, pickupLocation, numberOfItems, payout, status, cost }: Job): admin.firestore.DocumentData {
        return { customerLocation, pickupLocation, numberOfItems, payout, status, cost };
      },
      fromFirestore(
        snapshot: admin.firestore.QueryDocumentSnapshot<Job>
      ): Job {
        const { businessName, businessId, driverId, customerLocation, pickupLocation, numberOfItems, payout, status, cost } = snapshot.data();

        return new Job(businessName, businessId, driverId, customerLocation, pickupLocation, numberOfItems, payout, status, cost);
      }
    }
  }

  static getJobs(): Promise<Job[]> {
    return new Promise(resolve => {
      admin.firestore().collection('jobs').withConverter(this.getConverter()).where('status', '==', Status.AWAITING_ACCEPTANCE).onSnapshot(async (response) => {
        const collection = [];

        for (const job of response.docs) {
          collection.push(job.data());
        }

        resolve(collection);
      });
    });
  }

  static getJob(jobId: string): Promise<Job> {
    return new Promise<any>(resolve => {
      admin.firestore().collection('jobs').doc(jobId).withConverter(this.getConverter()).onSnapshot(response => {
        resolve(response.data());
      });
    });
  }

  static acceptJob(jobId: string) {
    admin.firestore().collection('jobs').doc(jobId).update({ status: Status.IN_PROGRESS })
  }

  static async completeJob(job: IJob) {
    const jobDoc = await admin.firestore().collection('jobs').doc(job.id).get();

    const updatedJobDoc = <IJob>jobDoc.data();

    const riderDoc = await admin.firestore().collection('users').doc(updatedJobDoc.driverId).get();

    const rider = <IUser>riderDoc.data();

    console.log(job.payout);
    console.log((percentage.of(2.5, job.payout / 100) + 0.20) * 100);
    await stripe.paymentIntents.create({
      amount: job.payout,
      application_fee_amount: (percentage.of(2.5, job.payout / 100) + 0.20) * 100,
      payment_method_types: [ 'card' ],
      currency: 'gbp',
      transfer_data: {
        destination: rider.stripeAccountId
      },
    });

    await admin.firestore().collection('jobs').doc(jobDoc.id).update({ status: Status.COMPLETED })
  }

  static async createJob(job: IJob, businessId: string) {
    const businessResponse = await admin.firestore().collection('users').doc(businessId).get();
    const business = <IUser>businessResponse.data();

    job.status = <any>'AWAITING_ACCEPTANCE';
    job.businessId = businessId;
    job.businessName = business.name;
    job.pickupLocation = new admin.firestore.GeoPoint(50.440941, 50.440941);
    job.customerLocation = new admin.firestore.GeoPoint(50.44437, -4.76287);

    return new Promise(async (resolve) => {
      await admin.firestore().collection('jobs').add(job);

      resolve({});
    })
  }
}
