import { StripeAuthStrategy } from "./../../classes/stripeAuthStrategy/index";
import { Response } from "./../../classes/response/index";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { Job } from "./../../classes/job/index";
import { JobStatus } from "dlvrry-common";
import Stripe from "stripe";

export const handlePaymentStatus = functions.https.onRequest(
  async (request, response) => {
    const job = new Job();
    const auth = new StripeAuthStrategy();

    if (!admin.apps.length) {
      admin.initializeApp();
    }

    try {
      auth.verify(request);

      const onboardingEvent: Stripe.Event = request.body;
      const object = <Stripe.PaymentIntent>onboardingEvent.data.object;

      await job.update(object.metadata.id, {
        charge_id: object.charges.data[0].id,
        payment_captured: true,
        status: JobStatus.PENDING,
      });

      response.send(Response.success());
    } catch (e) {
      response.status(e.status ? e.status : 500).send(Response.fail(e));
    }
  }
);
