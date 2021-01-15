import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Key } from '../../classes/key';

export const externalCreateJob = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  response.set('Access-Control-Allow-Origin', '*');

  if (request.method === 'OPTIONS') {
    response.set('Access-Control-Allow-Methods', 'POST');
    response.set('Access-Control-Max-Age', '3600');
    response.status(204).send('');
  } else {
    const parsedBody = JSON.parse(request.body);

    const result = await Key.validateKey(parsedBody);

    response.status(result.status).send(result);
  }
})

