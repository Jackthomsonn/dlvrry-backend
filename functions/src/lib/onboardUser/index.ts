import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Response } from './../../classes/response/index';
import { User } from '../../classes/user/index';
import { ValidateRequest } from './../../utils/auth';

export const onboardUser = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) admin.initializeApp();

  try {
    await ValidateRequest(request);

    const accountLinkUrl: string = await User.onboardUser(request.body);

    response.send(Response.success(accountLinkUrl));
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
});
