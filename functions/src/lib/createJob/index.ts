import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Job } from '../../classes/job';

export const createJob = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  await Job.createJob(request.body.job, request.body.owner_id);

  response.send();
})
