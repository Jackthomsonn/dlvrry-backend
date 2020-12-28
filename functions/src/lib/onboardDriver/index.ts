import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import Stripe from 'stripe';
import { User } from './../../classes/user/index';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export const onboardDriver = functions.https.onRequest(async (request, response) => {
  const { refreshUrl, returnUrl } = request.body;

  if (!admin.apps.length) {
    admin.initializeApp();
  }

  try {
    const user = await User.getUser(request.body.id);

    if (user) {
      if (user.stripeAccountId) {
        response.send(user.accountLinkUrl);

        return;
      }
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email: request.body.email,
      country: 'gb',
      default_currency: 'gbp',
    });

    const accountLinks = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${ refreshUrl }?account=${ account.id }`,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    const customer = await stripe.customers.create({
      email: request.body.email
    });

    await User.updateUser(request.body.id, {
      stripeAccountId: account.id,
      accountLinkUrl: accountLinks.url,
      customerId: customer.id
    });

    response.send(accountLinks.url);
  } catch (e) {
    response.send(e);
  };
});
