import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Response } from './../../classes/response/index';
import Stripe from 'stripe';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export const refreshAccountLink = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  try {
    const params: any = request.query;

    const accountLinks = await stripe.accountLinks.create({
      account: params.account,
      refresh_url: `${ functions.config().dlvrry.functions_url }/refreshAccountLink?account=${ params.account }`,
      return_url: functions.config().dlvrry.return_url,
      type: 'account_onboarding',
    });

    response.redirect(accountLinks.url);
  } catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})