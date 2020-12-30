import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { User } from '../../classes/user/index';

export const onboardUser = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const accountLinkUrl: string = await User.onboardUser(request.body);

  response.send(accountLinkUrl);
});
