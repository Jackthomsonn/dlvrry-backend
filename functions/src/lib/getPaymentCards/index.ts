import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Response } from './../../classes/response/index';
import { User } from './../../classes/user/index';
import { ValidateRequest } from './../../utils/auth';

export const getPaymentCards = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) admin.initializeApp();

  try {
    await ValidateRequest(request);

    const result = await User.getPaymentMethods(request);

    response.send(Response.success(result));
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})
