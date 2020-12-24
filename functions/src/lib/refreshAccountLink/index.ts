import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import Stripe from 'stripe';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export const refreshAccountLink = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const params: any = request.query;

  const accountLinks = await stripe.accountLinks.create({
    account: params.account,
    refresh_url: `https://dlvrry-functions.ngrok.io/dlvrry-33018/us-central1/refreshAccountLink?account=${ params.account }`,
    return_url: 'https://auth.expo.io/@jackthomson/dlvrry',
    type: 'account_onboarding',
  });

  response.redirect(accountLinks.url);
})