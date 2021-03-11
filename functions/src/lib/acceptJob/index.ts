import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Auth } from './../../classes/auth/index';
import { Job } from '../../classes/job';
import { Response } from '../../classes/response/index';

export const acceptJob = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  };

  try {
    await Auth.verify(request);

    await Job.acceptJob(request.body.id, request.body.rider_id);

    response.send(Response.success());
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})
