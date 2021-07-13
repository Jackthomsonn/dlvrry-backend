import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { FirebaseFunctionsRateLimiter } from "firebase-functions-rate-limiter";
import Stripe from "stripe";

import { User } from "./../../classes/user/index";

const stripe: Stripe = require("stripe")(
  functions.config().dlvrry[
    process.env.FUNCTIONS_EMULATOR === "true" ? "test" : "prod"
  ].stripe_secret
);

export const createUser = functions.auth.user().onCreate(async (user_data) => {
  const user = new User();

  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const limiter = FirebaseFunctionsRateLimiter.withFirestoreBackend(
    {
      name: "user_creation_limiter",
      maxCalls: 10000,
      periodSeconds: 2,
    },
    admin.firestore()
  );

  await limiter.rejectOnQuotaExceededOrRecordUsage();

  try {
    await user.createUser(user_data);

    const customer = await stripe.customers.create({
      email: user_data.email,
    });

    await user.update(user_data.uid, {
      customer_id: customer.id,
    });

    return;
  } catch (e) {
    return { status: 500, message: e.message };
  }
});
