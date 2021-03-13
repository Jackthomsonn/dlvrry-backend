import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { FirebaseAuthStrategy } from './../../classes/firebaseAuthStrategy/index';
import { Response } from './../../classes/response/index';
import { User } from './../../classes/user/index';

export const getConnectedAccountDetails = functions.https.onRequest(async (request, response) => {
  const user = new User();
  const auth = new FirebaseAuthStrategy();

  if (!admin.apps.length) {
    admin.initializeApp();
  };

  try {
    await auth.verify(request);

    const result = await user.getConnectedAccountDetails(request);

    response.send(Response.success(result));
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})