"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeJob = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const job_1 = require("../../classes/job");
exports.completeJob = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    await job_1.Job.completeJob(request.body.job);
    response.send({ completed: true });
});
//# sourceMappingURL=index.js.map