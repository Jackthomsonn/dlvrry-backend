import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Unauthorized } from './../errors/unauthorized';

export const ValidateRequest = async (request: functions.Request) => {
  try {
    if (!request.headers.authorization) {
      throw new Unauthorized();
    }

    const token = await admin.auth().verifyIdToken(request.headers.authorization, true);

    if (token.uid !== request.body.id) {
      throw new Unauthorized();
    }
  } catch (e) {
    console.log(e.message)
    throw e;
  }
}