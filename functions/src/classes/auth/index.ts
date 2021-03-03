import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import Stripe from 'stripe';

import { Unauthorized } from '../../errors/unauthorized';

export class Auth {
  static async verify(request: functions.Request): Promise<admin.auth.DecodedIdToken> {
    try {
      if (!request.headers.authorization) throw new Unauthorized();

      const token = await admin.auth().verifyIdToken(request.headers.authorization, true);

      return Promise.resolve(token);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static verifyWebhook(request: functions.Request | any) {
    const stripe: Stripe = require('stripe')(functions.config().dlvrry.stripe_secret);

    const signature = <string>request.headers[ 'stripe-signature' ];

    stripe.webhooks.constructEvent(request[ 'rawBody' ], signature, functions.config().dlvrry.account_status_secret);
  }
}