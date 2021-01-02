import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import Stripe from 'stripe';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export const getPaymentCards = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: request.body.customer_id,
    type: 'card'
  });

  response.send(paymentMethods);
})
