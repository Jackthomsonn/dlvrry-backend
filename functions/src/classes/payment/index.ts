import * as functions from "firebase-functions";

import Stripe from "stripe";
import { IJob, IUser } from "dlvrry-common";
import { UserNotFound } from "../../errors/userNotFound";
import { get_env } from "../../helpers/env";

const stripe: Stripe = require("stripe")(
  functions.config().dlvrry[get_env()].stripe_secret
);

export class Payment {
  static async create(job: IJob, owner_doc: IUser) {
    const stripe_customer: any = await stripe.customers.retrieve(
      owner_doc.customer_id
    );
    const customer = <Stripe.Customer>stripe_customer;

    return stripe.paymentIntents.create({
      amount: job.cost,
      payment_method: <string>customer.invoice_settings.default_payment_method,
      customer: owner_doc.customer_id,
      currency: "gbp",
      confirm: true,
      off_session: true,
      metadata: {
        id: job.id,
      },
    });
  }

  static async transferFunds(job: IJob, rider_doc: IUser | undefined) {
    if (!rider_doc?.connected_account_id) {
      throw new UserNotFound();
    }

    return stripe.transfers.create({
      source_transaction: job.charge_id,
      currency: "gbp",
      amount: job.payout,
      destination: rider_doc.connected_account_id,
    });
  }

  static async getPaymentMethods(request: functions.Request) {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: request.body.customer_id,
      type: "card",
    });

    const customer = <Stripe.Customer>(
      await stripe.customers.retrieve(request.body.customer_id)
    );

    const result = paymentMethods.data.map((paymentMethod) => {
      return {
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        is_default_payment_method:
          customer.invoice_settings.default_payment_method === paymentMethod.id,
      };
    });

    return Promise.resolve(result);
  }

  static async addPaymentMethod(request: functions.Request) {
    const payment_method_id: any = request.query.id;
    const customer_id: any = (<string>request.query.customer_id).split("?")[0];

    const paymentIntent = await stripe.setupIntents.create({
      payment_method: payment_method_id,
      customer: customer_id,
      confirm: true,
    });

    if (paymentIntent.next_action) {
      return Promise.resolve({
        completed: false,
        payment_method: paymentIntent.payment_method,
        client_secret: paymentIntent.client_secret,
      });
    } else {
      return Promise.resolve({ completed: true });
    }
  }

  static async completeAddPaymentMethod(request: functions.Request) {
    const payment_method_id: any = request.query.id;
    const customer_id: any = (<string>request.query.customer_id).split("?")[0];

    await stripe.paymentMethods.attach(payment_method_id, {
      customer: customer_id,
    });

    await this.setDefaultPaymentMethod(customer_id, payment_method_id);
  }

  static async setDefaultPaymentMethod(
    customer_id: string,
    payment_method_id: string
  ) {
    await stripe.customers.update(customer_id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });
  }

  static async removePaymentMethod(payment_method_id: string) {
    await stripe.paymentMethods.detach(payment_method_id);
  }
}
