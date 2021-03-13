import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { FirebaseAuthStrategy } from './../../classes/firebaseAuthStrategy/index';
import { Job } from './../../classes/job/index';
import { Response } from '../../classes/response/index';

export const acceptJob = functions.https.onRequest(async (request, response) => {
  const job = new Job();
  const auth = new FirebaseAuthStrategy();

  if (!admin.apps.length) {
    admin.initializeApp();
  };

  try {
    await auth.verify(request);

    await job.acceptJob(request.body.id, request.body.rider_id);

    response.send(Response.success());
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})
