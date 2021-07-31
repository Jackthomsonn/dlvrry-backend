import { Unauthorized } from "./../../errors/unauthorized";
import { Auth } from "../auth";
import Stripe from "stripe";
import * as functions from "firebase-functions";
import { get_env } from "../../helpers/env";

const stripe: Stripe = require("stripe")(
  functions.config().dlvrry[get_env()].stripe_secret
);

export class StripeAuthStrategy implements Auth<void, any> {
  verify(request: any, secret: string) {
    const signature = <string>request.headers["stripe-signature"];

    try {
      stripe.webhooks.constructEvent(request["rawBody"], signature, secret);
    } catch (e) {
      throw new Unauthorized();
    }
  }
}
