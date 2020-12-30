import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { User } from './../../classes/user/index';

export const createUser = functions.auth.user().onCreate(async (user) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  await User.createUser(user);

  return { completed: true }
});
