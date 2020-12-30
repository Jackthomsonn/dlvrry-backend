import * as admin from 'firebase-admin';

import { IUser, Role, VerificationStatus } from 'dlvrry-common';

import Stripe from 'stripe';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export class User implements IUser {
  readonly id: string = '';

  constructor(
    readonly name: string,
    readonly email: string,
    readonly role: Role,
    readonly connected_account_id: string,
    readonly account_link_url: string,
    readonly verification_status: VerificationStatus,
    readonly verified: boolean,
    readonly customer_id: string,
  ) { }

  static getConverter() {
    return {
      toFirestore({ name, email, role, connected_account_id, account_link_url, customer_id, verification_status, verified }: User): admin.firestore.DocumentData {
        return { name, email, role, connected_account_id, account_link_url, customer_id, verification_status, verified };
      },
      fromFirestore(
        snapshot: admin.firestore.QueryDocumentSnapshot<User>
      ): User {
        const { name, email, role, connected_account_id, account_link_url, customer_id, verification_status, verified } = snapshot.data();

        return new User(name, email, role, connected_account_id, account_link_url, verification_status, verified, customer_id);
      }
    }
  }

  static getUsers(): Promise<User[]> {
    return new Promise(resolve => {
      admin
        .firestore()
        .collection('users')
        .withConverter(this.getConverter())
        .onSnapshot(async (response) => {
          const collection = [];

          for (const user of response.docs) {
            collection.push(user.data());
          }

          resolve(collection);
        });
    });
  }

  static getUser(id: string): Promise<User> {
    return new Promise<any>(resolve => {
      admin
        .firestore()
        .collection('users')
        .doc(id)
        .withConverter(this.getConverter())
        .onSnapshot(async (response) => {
          resolve(response.data());
        });
    });
  }

  static updateUser(id: string, user: Partial<IUser>): Promise<admin.firestore.WriteResult> {
    return admin
      .firestore()
      .collection('users')
      .doc(id)
      .update(user);
  }

  static createUser(user: admin.auth.UserRecord): Promise<admin.firestore.WriteResult> {
    return admin
      .firestore()
      .collection('users')
      .doc(user.uid)
      .withConverter(this.getConverter())
      .create({
        id: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        connected_account_id: '',
        account_link_url: '',
        role: Role.NONE,
        customer_id: '',
        verification_status: VerificationStatus.PENDING,
        verified: false
      });
  }

  static async getUserLoginLink(id: string) {
    const user = await User.getUser(id);
    const account = await stripe.accounts.retrieve(user.connected_account_id);

    return await stripe.accounts.createLoginLink(account.id);
  }

  static async onboardUser(request: any) {
    const { id, email, refreshUrl, returnUrl } = request;

    const user = await User.getUser(id);

    if (user && user.connected_account_id) {
      return Promise.resolve(user.account_link_url);
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email: email,
      country: 'gb',
      default_currency: 'gbp',
    });

    const account_links = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${ refreshUrl }?account=${ account.id }`,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    const customer = await stripe.customers.create({
      email: email
    });

    await User.updateUser(id, {
      connected_account_id: account.id,
      account_link_url: account_links.url,
      customer_id: customer.id
    });

    return Promise.resolve(account_links.url);
  }
}