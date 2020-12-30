import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { User } from '../../classes/user/index';

export const getLoginLink = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const loginLink = await User.getUserLoginLink(request.body.id);

  response.send(loginLink);
})