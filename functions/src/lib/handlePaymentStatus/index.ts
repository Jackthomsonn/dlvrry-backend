import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Job } from './../../classes/job/index';
import { JobStatus } from 'dlvrry-common';
import Stripe from 'stripe';

export const handlePaymentStatus = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) admin.initializeApp();

  const onboardingEvent: Stripe.Event = request.body;
  const object = <Stripe.PaymentIntent>onboardingEvent.data.object;

  await Job.updateJob(object.metadata.id, { charge_id: object.charges.data[ 0 ].id, payment_captured: true, status: JobStatus.PENDING });

  response.send();
})
