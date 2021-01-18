import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Response } from './../../classes/response/index';
import { v4 as uuidv4 } from 'uuid';

export const createSessionToken = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  try {
    response.send(Response.success(uuidv4()));
  } catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})