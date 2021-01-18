"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJob = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const job_1 = require("../../classes/job");
exports.createJob = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    await job_1.Job.createJob(request.body.job, request.body.owner_id);
    response.send();
});
//# sourceMappingURL=index.js.map