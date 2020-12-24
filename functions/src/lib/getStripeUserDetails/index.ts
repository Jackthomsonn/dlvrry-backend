import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import Stripe from 'stripe';
import { User } from '../../classes/user/index';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export const getStripeUserDetails = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const user = await User.getUser(request.body.id);

  const account = await stripe.accounts.retrieve(user.stripeAccountId);

  response.send(account);
})