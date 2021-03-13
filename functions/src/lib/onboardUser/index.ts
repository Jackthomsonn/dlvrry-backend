import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { FirebaseAuthStrategy } from './../../classes/firebaseAuthStrategy/index';
import { Response } from './../../classes/response/index';
import { User } from './../../classes/user/index';

export const onboardUser = functions.https.onRequest(async (request, response) => {
  const user = new User();
  const auth = new FirebaseAuthStrategy();

  if (!admin.apps.length) {
    admin.initializeApp();
  };

  try {
    await auth.verify(request);

    const accountLinkUrl = await user.onboardUser(request.body);

    response.send(Response.success(accountLinkUrl));
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
});
