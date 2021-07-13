import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { Auth } from "../auth";
import { Unauthorized } from "../../errors/unauthorized";

export class FirebaseAuthStrategy
  implements Auth<Promise<admin.auth.DecodedIdToken>, functions.Request>
{
  async verify(request: functions.Request): Promise<admin.auth.DecodedIdToken> {
    try {
      if (!request.headers.authorization) {
        throw new Unauthorized();
      }

      const token = await admin
        .auth()
        .verifyIdToken(request.headers.authorization, true);

      return Promise.resolve(token);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
