import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Job } from '../../classes/job';
import { Response } from './../../classes/response/index';
import Stripe from 'stripe';

export const completeJob = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) admin.initializeApp();

  try {
    await Job.completeJob(request.body.job);

    response.send(Response.success());
  }
  catch (e) {
    if (e.type instanceof Stripe.errors.StripeInvalidRequestError) {
      response.send(Response.success({ message: e.message }));
    } else {
      response.status(e.status ? e.status : 500).send(Response.fail(e));
    }
  }
})