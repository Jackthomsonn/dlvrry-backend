import * as admin from 'firebase-admin';

import { IUser } from '../../interfaces/IUser';
import { Role } from './../../enums/role/index';
import Stripe from 'stripe';

const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET);

export class User implements IUser {
  readonly id: string = '';

  constructor(
    readonly name: string,
    readonly email: string,
    readonly role: Role,
    readonly stripeAccountId: string,
    readonly accountLinkUrl: string
  ) { }

  static getConverter() {
    return {
      toFirestore({ name, email, role, stripeAccountId, accountLinkUrl }: User): admin.firestore.DocumentData {
        return { name, email, role, stripeAccountId, accountLinkUrl };
      },
      fromFirestore(
        snapshot: admin.firestore.QueryDocumentSnapshot<User>
      ): User {
        const { name, email, role, stripeAccountId, accountLinkUrl } = snapshot.data();

        return new User(name, email, role, stripeAccountId, accountLinkUrl);
      }
    }
  }

  static getUsers(): Promise<User[]> {
    return new Promise(resolve => {
      admin.firestore().collection('users').withConverter(this.getConverter()).onSnapshot(async (response) => {
        const collection = [];

        for (const user of response.docs) {
          collection.push(user.data());
        }

        resolve(collection);
      });
    });
  }

  static getUser(userId: string): Promise<User> {
    return new Promise(resolve => {
      admin.firestore().collection('users').doc(userId).withConverter(this.getConverter()).onSnapshot(async (response) => {
        resolve(response.data());
      });
    });
  }

  static getUserStripeDetails(userId: string): Promise<Stripe.Account> {
    return new Promise(async (resolve) => {
      const user = await User.getUser(userId);

      const account = await stripe.accounts.retrieve(user.stripeAccountId);

      resolve(account);
    });
  }

  static updateUser(userId: string, newData: admin.firestore.UpdateData): Promise<admin.firestore.WriteResult> {
    return admin.firestore().collection('users').doc(userId).withConverter(this.getConverter()).update(newData);
  }

  static createUser(user: admin.auth.UserRecord): Promise<admin.firestore.WriteResult> {
    return admin.firestore().collection('users').doc(user.uid).withConverter(this.getConverter()).set({
      id: user.uid,
      name: user.displayName || '',
      email: user.email || '',
      stripeAccountId: '' || '',
      accountLinkUrl: '' || '',
      role: Role.RIDER
    });
  }
}