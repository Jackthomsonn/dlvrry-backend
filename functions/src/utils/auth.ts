import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Unauthorized } from './../errors/unauthorized';

export const ValidateRequest = async (request: functions.Request): Promise<admin.auth.DecodedIdToken> => {
  try {
    if (!request.headers.authorization) {
      throw new Unauthorized();
    }

    const token = await admin.auth().verifyIdToken(request.headers.authorization, true);

    if (token.uid !== request.body.id) {
      throw new Unauthorized();
    }

    return Promise.resolve(token);
  } catch (e) {
    throw e;
  }
}
