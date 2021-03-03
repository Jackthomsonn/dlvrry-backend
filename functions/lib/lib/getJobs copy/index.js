"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobs = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const job_1 = require("../../classes/job");
exports.getJobs = functions.https.onRequest(async (_request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    const jobs = await job_1.Job.getJobs();
    response.send(jobs);
});
//# sourceMappingURL=index.js.map