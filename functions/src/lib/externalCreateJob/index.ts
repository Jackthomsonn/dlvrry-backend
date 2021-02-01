import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Key } from '../../classes/key';
import { Response } from './../../classes/response/index';
import { handleCors } from '../../utils/cors';

export const externalCreateJob = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) admin.initializeApp();

  if (request.method === 'OPTIONS') handleCors(response);

  try {
    const parsedBody = JSON.parse(request.body);

    const result = await Key.validateKey(parsedBody);

    response.send(Response.success(result));
  }
  catch (e) {
    response.status(500).send(Response.fail(e));
  }
});

