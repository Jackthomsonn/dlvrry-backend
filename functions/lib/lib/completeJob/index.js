"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeJob = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const auth_1 = require("../../classes/auth");
const job_1 = require("../../classes/job");
const index_1 = require("./../../classes/response/index");
exports.completeJob = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length)
        admin.initializeApp();
    try {
        const token = await auth_1.Auth.verify(request);
        await job_1.Job.completeJob(request.body.job, token);
        response.send(index_1.Response.success());
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map