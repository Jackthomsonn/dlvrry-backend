import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { User } from './../../classes/user/index';

export const createUser = functions.auth.user().onCreate(async (user) => {
  if (!admin.apps.length) admin.initializeApp();

  try {
    await User.createUser(user);

    return;
  }
  catch (e) {
    return { status: 500, message: e.message };
  }
});
