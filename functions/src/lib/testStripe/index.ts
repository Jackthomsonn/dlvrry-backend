import * as functions from 'firebase-functions';

import Stripe from 'stripe';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export const testStripe = functions.https.onRequest(async (request, response) => {

  const r = await stripe.accounts.list();

  // for (let key of r.data) {
  //   await stripe.accounts.del(key.id)
  // }

  // await stripe.accounts.del(r.data[ 0 ].id)
  response.send(r);
})