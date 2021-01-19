import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Response } from './../../classes/response/index';
import { Stripe } from 'stripe';
import { handleCors } from '../../utils/cors';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export const addPaymentMethod = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  response.set('Access-Control-Allow-Origin', '*');

  if (request.method === 'OPTIONS') {
    handleCors(response);
  }

  try {
    const payment_method_id: any = request.query.id;
    const customer_id: any = request.query.customer_id;

    await stripe.paymentMethods.attach(payment_method_id, { customer: customer_id });

    await stripe.customers.update(customer_id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100,
      payment_method: payment_method_id,
      customer: customer_id,
      confirm: true,
      currency: 'gbp',
      setup_future_usage: 'off_session',
      capture_method: 'manual',
    });

    if (paymentIntent.next_action) {
      response.send(Response.success({
        completed: false,
        payment_method: paymentIntent.payment_method,
        client_secret: paymentIntent.client_secret,
      }));
    } else {
      response.send(Response.success({ completed: true }));
    }
  } catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})