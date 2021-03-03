"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJob = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const job_1 = require("../../classes/job");
exports.getJob = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    const job = await job_1.Job.getJob(request.body.id);
    response.send(job);
});
//# sourceMappingURL=index.js.map