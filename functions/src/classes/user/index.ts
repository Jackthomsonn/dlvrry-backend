import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { AccountType, IUser } from "dlvrry-common";

import { Crud } from "./../base/index";
import Stripe from "stripe";
import { UserNotFound } from "../../errors/userNotFound";
import { Unauthorized } from "../../errors/unauthorized";

const stripe: Stripe = require("stripe")(
  functions.config().dlvrry[
    process.env.FUNCTIONS_EMULATOR === "true" ? "test" : "prod"
  ].stripe_secret
);

export class User extends Crud<IUser> {
  constructor() {
    super("users");
  }

  createUser(
    user: admin.auth.UserRecord
  ): Promise<admin.firestore.WriteResult> {
    return admin.firestore().collection("users").doc(user.uid).create({
      id: user.uid,
      name: user.displayName,
      email: user.email,
      account_type: AccountType.NONE,
      verified: false,
    });
  }

  async getUserLoginLink(id: string) {
    const user = await this.get(id);
    const user_doc_data = user.data();

    if (!user_doc_data?.connected_account_id) {
      throw new UserNotFound();
    }

    const account = await stripe.accounts.retrieve(
      user_doc_data.connected_account_id
    );

    return await stripe.accounts.createLoginLink(account.id);
  }

  async onboardUser(request: any) {
    const { id, email, refreshUrl, returnUrl } = request;

    const user = await this.get(id);
    const user_doc_data = user.data();

    if (!user_doc_data) {
      throw new UserNotFound();
    }

    if (user_doc_data.connected_account_id) {
      return Promise.resolve(user_doc_data.account_link_url);
    }

    const account = await stripe.accounts.create({
      type: "express",
      email: email,
      country: "gb",
      default_currency: "gbp",
    });

    const account_links = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${refreshUrl}?account=${account.id}`,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    await this.update(id, {
      connected_account_id: account.id,
      account_link_url: account_links.url,
    });

    return Promise.resolve(account_links.url);
  }

  async getConnectedAccountDetails(request: functions.Request) {
    const user = await this.get(request.body.id);
    const user_data = user.data();

    if (!user_data?.connected_account_id) {
      return Promise.reject({ status: 404, message: "No user found" });
    }

    const account = await stripe.accounts.retrieve(
      user_data.connected_account_id
    );

    return Promise.resolve(account);
  }

  async refreshAccountLink(
    request: functions.Request,
    token: admin.auth.DecodedIdToken
  ) {
    const params: any = request.query;
    const user = new User();
    const user_data = await user.get(token.uid);
    const user_doc_data = user_data.data();

    if (user_doc_data?.connected_account_id !== request.query.account) {
      throw new Unauthorized();
    }

    const accountLinks = await stripe.accountLinks.create({
      account: params.account,
      refresh_url: `${
        functions.config().dlvrry[
          process.env.FUNCTIONS_EMULATOR === "true" ? "test" : "prod"
        ].functions_url
      }/refreshAccountLink?account=${params.account}`,
      return_url:
        functions.config().dlvrry[
          process.env.FUNCTIONS_EMULATOR === "true" ? "test" : "prod"
        ].return_url,
      type: "account_onboarding",
    });

    return Promise.resolve(accountLinks.url);
  }
}
