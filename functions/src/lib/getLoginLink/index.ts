import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Auth } from '../../classes/auth';
import { Response } from './../../classes/response/index';
import { User } from '../../classes/user/index';

export const getLoginLink = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) admin.initializeApp();

  try {
    await Auth.verify(request);

    const loginLink = await User.getUserLoginLink(request.body.id);

    response.send(Response.success(loginLink));
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})