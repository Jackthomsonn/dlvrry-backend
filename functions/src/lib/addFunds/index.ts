import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import Stripe from 'stripe';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export const addFunds = functions.https.onRequest(async (request, response) => {
  response.set('Access-Control-Allow-Origin', "*")

  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const intent = await stripe.paymentIntents.create({
    amount: Number(request.query.amount),
    currency: 'gbp',
    metadata: { integration_check: 'accept_a_payment' },
  });

  response.send(intent.client_secret);
})