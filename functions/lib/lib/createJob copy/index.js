"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJob = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const job_1 = require("../../classes/job");
const index_1 = require("./../../classes/response/index");
exports.createJob = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    try {
        await job_1.Job.createJob(request.body.job, request.body.owner_id);
        response.send(index_1.Response.success());
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map