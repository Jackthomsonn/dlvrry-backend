import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Stripe } from 'stripe';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export const addPaymentMethod = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const payment_method_id: any = request.query.id;
  const customer_id: any = request.query.customer_id;

  await stripe.paymentMethods.attach(payment_method_id, { customer: customer_id });

  await stripe.customers.update(customer_id, {
    invoice_settings: {
      default_payment_method: payment_method_id
    }
  });

  response.send();
})