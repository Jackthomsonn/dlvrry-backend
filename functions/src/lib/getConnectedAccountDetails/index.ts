import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Auth } from './../../classes/auth/index';
import { Response } from './../../classes/response/index';
import { User } from '../../classes/user/index';

export const getConnectedAccountDetails = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) admin.initializeApp();

  try {
    await Auth.verify(request);

    const result = await User.getConnectedAccountDetails(request);

    response.send(Response.success(result));
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})