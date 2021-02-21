import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Response } from './../../classes/response/index';
import { User } from './../../classes/user/index';
import { handleCors } from '../../utils/cors';

export const addPaymentMethod = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) admin.initializeApp();

  response.set('Access-Control-Allow-Origin', '*');

  if (request.method === 'OPTIONS') handleCors(response);

  try {
    const result = await User.addPaymentMethod(request);

    response.send(Response.success(result));
  }
  catch (e) {
    console.log(e);
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})