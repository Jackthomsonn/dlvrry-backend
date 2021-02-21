import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Job } from './../../classes/job/index';
import { JobStatus } from 'dlvrry-common';

export const handlePaymentStatus = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) admin.initializeApp();

  await Job.updateJob(request.body.data.object.metadata.id, { charge_id: request.body.data.object.charges.data[ 0 ].id, payment_captured: true, status: JobStatus.PENDING });

  response.send();
})
