import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { Job } from "../../classes/job";

import { FirebaseAuthStrategy } from "./../../classes/firebaseAuthStrategy/index";
import { Response } from "./../../classes/response/index";

export const completeJob = functions
  .runWith({ failurePolicy: true })
  .https.onRequest(async (request, response) => {
    const job = new Job();
    const auth = new FirebaseAuthStrategy();

    if (!admin.apps.length) {
      admin.initializeApp();
    }

    try {
      const token = await auth.verify(request);

      await job.completeJob(request.body.job, token);

      response.send(Response.success());
    } catch (e) {
      response.status(e.status ? e.status : 500).send(Response.fail(e));
    }
  });
