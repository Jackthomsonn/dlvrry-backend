import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Response } from './../../classes/response/index';
import { User } from './../../classes/user/index';

export const refreshAccountLink = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  };

  try {
    const accountLinkUrl = await User.refreshAccountLink(request);

    response.redirect(accountLinkUrl);
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})