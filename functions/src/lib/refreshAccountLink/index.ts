import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { FirebaseAuthStrategy } from "../../classes/firebaseAuthStrategy";

import { Response } from "./../../classes/response/index";
import { User } from "./../../classes/user/index";

export const refreshAccountLink = functions.https.onRequest(
  async (request, response) => {
    const user = new User();
    const auth = new FirebaseAuthStrategy();

    if (!admin.apps.length) {
      admin.initializeApp();
    }

    try {
      const token = await auth.verify(request);

      const accountLinkUrl = await user.refreshAccountLink(request, token);

      response.redirect(accountLinkUrl);
    } catch (e) {
      response.status(e.status ? e.status : 500).send(Response.fail(e));
    }
  }
);
