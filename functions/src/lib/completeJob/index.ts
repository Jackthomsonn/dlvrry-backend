import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Auth } from '../../classes/auth';
import { Job } from '../../classes/job';
import { Response } from './../../classes/response/index';

export const completeJob = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  };

  try {
    const token = await Auth.verify(request);

    await Job.completeJob(request.body.job, token);

    response.send(Response.success());
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})