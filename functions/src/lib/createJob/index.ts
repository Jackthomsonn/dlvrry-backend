import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Job } from '../../classes/job';
import { Response } from './../../classes/response/index';

export const createJob = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) admin.initializeApp();

  try {
    const result = await Job.createJob(request.body.job, request.body.rider_id);

    response.send(Response.success(result));
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})
