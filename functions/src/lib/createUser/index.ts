import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { User } from './../../classes/user/index';

export const createUser = functions.auth.user().onCreate(user => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  User.createUser(user);

  return { created: true }
});
