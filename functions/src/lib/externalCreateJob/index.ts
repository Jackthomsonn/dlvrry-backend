import * as admin from 'firebase-admin';
import * as express from 'express';
import * as functions from 'firebase-functions';
import * as jwks from 'jwks-rsa';
import * as jwt from 'express-jwt';
import * as jwtauthz from 'express-jwt-authz';

import { FirebaseFunctionsRateLimiter } from 'firebase-functions-rate-limiter';
import { Job } from './../../classes/job/index';
import { Response } from '../../classes/response';

if (!admin.apps.length) admin.initializeApp();

const limiter = FirebaseFunctionsRateLimiter.withFirestoreBackend(
  {
    name: 'external_job_creation_limiter',
    maxCalls: 2,
    periodSeconds: 10,
  },
  admin.firestore()
);

const app = express();

const jwtCheck = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'https://dlvrry.eu.auth0.com/.well-known/jwks.json',
  }),
  audience: 'https://dlvrry-functions.ngrok.io/dlvrry-33018/us-central1',
  issuer: 'https://dlvrry.eu.auth0.com/',
  algorithms: [ 'RS256' ],
});

app.get('/', jwtCheck, jwtauthz([ 'create:job' ]), async (request, response) => {
  try {
    await limiter.rejectOnQuotaExceededOrRecordUsage();

    await Job.createJob(request.body.job, 'external');

    response.send(Response.success());
  } catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})

export const externalCreateJob = functions.https.onRequest(app);

