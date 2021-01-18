import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Response } from './../../classes/response/index';
import Stripe from 'stripe';
import { User } from '../../classes/user/index';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export const getConnectedAccountDetails = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  try {
    const user = await User.getUser(request.body.id);
    const user_data = user.data();

    if (!user_data) {
      response.status(404).send(Response.fail({ status: 404, message: 'No user found' }));
    } else {
      const account = await stripe.accounts.retrieve(user_data.connected_account_id);

      response.send(Response.success(account));
    }
  } catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})