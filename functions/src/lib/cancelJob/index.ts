import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Job } from '../../classes/job';
import { Response } from '../../classes/response/index';
import { ValidateRequest } from './../../utils/auth';

export const cancelJob = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) admin.initializeApp();

  try {
    const token = await ValidateRequest(request);

    await Job.cancelJob(request.body.job, token);

    response.send(Response.success());
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})