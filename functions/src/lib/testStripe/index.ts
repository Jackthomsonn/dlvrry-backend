import * as functions from 'firebase-functions';

import Stripe from 'stripe';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export const testStripe = functions.https.onRequest(async (request, response) => {

  const r = await stripe.customers.retrieve('cus_IeiHtjkgePbhKE');

  response.send(r);
})