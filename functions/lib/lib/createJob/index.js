"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJob = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const auth_1 = require("../../classes/auth");
const firebase_functions_rate_limiter_1 = require("firebase-functions-rate-limiter");
const job_1 = require("../../classes/job");
const index_1 = require("./../../classes/response/index");
exports.createJob = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length)
        admin.initializeApp();
    const limiter = firebase_functions_rate_limiter_1.default.withFirestoreBackend({
        name: 'job_creation_limiter',
        maxCalls: 2,
        periodSeconds: 10,
    }, admin.firestore());
    try {
        await auth_1.Auth.verify(request);
        await limiter.rejectOnQuotaExceededOrRecordUsage();
        const result = await job_1.Job.createJob(request.body.job, request.body.rider_id);
        response.send(index_1.Response.success(result));
    }
    catch (e) {
        console.log(e);
        response.status(e.status ? e.status : 500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map