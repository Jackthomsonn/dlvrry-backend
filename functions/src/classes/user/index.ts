import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { AccountType, IUser, ModeType, VerificationStatus } from 'dlvrry-common';

import Stripe from 'stripe';
import { UserNotFound } from '../../errors/userNotFound';

const stripe: Stripe = require('stripe')(functions.config().dlvrry.stripe_secret);

export class User implements IUser {
  constructor(
    readonly name: string,
    readonly email: string,
    readonly account_type: AccountType,
    readonly connected_account_id: string,
    readonly account_link_url: string,
    readonly verification_status: VerificationStatus,
    readonly cancelled_jobs: number,
    readonly verified: boolean,
    readonly customer_id: string,
    readonly mode: ModeType,
    readonly id?: string,
  ) { }

  static getConverter() {
    return {
      toFirestore(user: User): admin.firestore.DocumentData { return user },
      fromFirestore(snapshot: admin.firestore.QueryDocumentSnapshot<User>) { return snapshot.data() },
    }
  }

  static getUsers(): Promise<FirebaseFirestore.QuerySnapshot<User>> {
    return admin
      .firestore()
      .collection('users')
      .withConverter(this.getConverter())
      .get()
  }

  static getUser(id: string): Promise<FirebaseFirestore.DocumentSnapshot<User>> {
    return admin
      .firestore()
      .collection('users')
      .withConverter(this.getConverter())
      .doc(id)
      .get()
  }

  static async updateUser(id: string, user: Partial<IUser>): Promise<admin.firestore.WriteResult> {
    return admin
      .firestore()
      .collection('users')
      .withConverter(this.getConverter())
      .doc(id)
      .update(user);
  }

  static async updateUserWhere(user: Partial<IUser>, where: { whereField: any, whereOp: any, whereValue: any }): Promise<admin.firestore.WriteResult> {
    const userDoc = await admin
      .firestore()
      .collection('users')
      .where(where.whereField, where.whereOp, where.whereValue)
      .withConverter(this.getConverter())
      .get();

    return admin
      .firestore()
      .collection('users')
      .withConverter(this.getConverter())
      .doc(userDoc.docs[ 0 ].data().id || '')
      .update(user)
  }

  static createUser(user: admin.auth.UserRecord): Promise<admin.firestore.WriteResult> {
    return admin
      .firestore()
      .collection('users')
      .withConverter(this.getConverter())
      .doc(user.uid)
      .create({
        id: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        connected_account_id: '',
        account_link_url: '',
        account_type: AccountType.NONE,
        customer_id: '',
        verification_status: VerificationStatus.PENDING,
        cancelled_jobs: 0,
        verified: false,
        mode: ModeType.NOT_APPLICABLE,
      });
  }

  static async getUserLoginLink(id: string) {
    const user = await User.getUser(id);
    const userData = user?.data();

    if (!userData) {
      throw new UserNotFound();
    }

    const account = await stripe.accounts.retrieve(userData.connected_account_id);

    return await stripe.accounts.createLoginLink(account.id);
  }

  static async onboardUser(request: any) {
    const { id, email, refreshUrl, returnUrl } = request;

    const user = await User.getUser(id);
    const userData = user?.data();

    if (!userData) {
      throw new UserNotFound();
    }

    if (userData.connected_account_id) {
      return Promise.resolve(userData.account_link_url);
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

    await User.updateUser(id, {
      connected_account_id: account.id,
      account_link_url: account_links.url,
    });

    return Promise.resolve(account_links.url);
  }

  static async getConnectedAccountDetails(request: functions.Request) {
    const user = await User.getUser(request.body.id);
    const user_data = user.data();

    if (!user_data) {
      return Promise.reject({ status: 404, message: 'No user found' });
    } else {
      const account = await stripe.accounts.retrieve(user_data.connected_account_id);

      return Promise.resolve(account);
    }
  }

  static async refreshAccountLink(request: functions.Request) {
    const params: any = request.query;

    const accountLinks = await stripe.accountLinks.create({
      account: params.account,
      refresh_url: `${ functions.config().dlvrry.functions_url }/refreshAccountLink?account=${ params.account }`,
      return_url: functions.config().dlvrry.return_url,
      type: 'account_onboarding',
    });

    return Promise.resolve(accountLinks.url);
  }
}