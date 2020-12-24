import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Job } from '../../classes/job';

export const completeJob = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  await Job.completeJob(request.body.job);

  response.send({ completed: true });
})