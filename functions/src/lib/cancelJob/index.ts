import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { FirebaseAuthStrategy } from './../../classes/firebaseAuthStrategy/index';
import { Job } from '../../classes/job';
import { Response } from '../../classes/response/index';

export const cancelJob = functions.https.onRequest(async (request, response) => {
  const job = new Job();
  const auth = new FirebaseAuthStrategy();

  if (!admin.apps.length) {
    admin.initializeApp();
  };

  try {
    const token = await auth.verify(request);

    await job.cancelJob(request.body.id, token);

    response.send(Response.success());
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})