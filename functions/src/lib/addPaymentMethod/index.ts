import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Stripe } from 'stripe';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export const addPaymentMethod = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const paymentMethodId: any = request.query.id;
  const customerId: any = request.query.customerId;

  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId
  });

  await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });

  response.send({ done: true });
})