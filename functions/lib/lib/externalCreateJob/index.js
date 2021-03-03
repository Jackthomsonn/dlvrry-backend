"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalCreateJob = void 0;
const admin = require("firebase-admin");
const express = require("express");
const functions = require("firebase-functions");
const jwks = require("jwks-rsa");
const jwt = require("express-jwt");
const jwtauthz = require("express-jwt-authz");
const firebase_functions_rate_limiter_1 = require("firebase-functions-rate-limiter");
const index_1 = require("./../../classes/job/index");
const response_1 = require("../../classes/response");
if (!admin.apps.length)
    admin.initializeApp();
const limiter = firebase_functions_rate_limiter_1.FirebaseFunctionsRateLimiter.withFirestoreBackend({
    name: 'external_job_creation_limiter',
    maxCalls: 2,
    periodSeconds: 10,
}, admin.firestore());
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
    algorithms: ['RS256'],
});
app.get('/', jwtCheck, jwtauthz(['create:job']), async (request, response) => {
    try {
        await limiter.rejectOnQuotaExceededOrRecordUsage();
        await index_1.Job.createJob(request.body.job, 'external');
        response.send(response_1.Response.success());
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(response_1.Response.fail(e));
    }
});
exports.externalCreateJob = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map