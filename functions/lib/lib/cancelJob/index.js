"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelJob = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const auth_1 = require("../../classes/auth");
const job_1 = require("../../classes/job");
const index_1 = require("../../classes/response/index");
exports.cancelJob = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length)
        admin.initializeApp();
    try {
        const token = await auth_1.Auth.verify(request);
        await job_1.Job.cancelJob(request.body.id, token);
        response.send(index_1.Response.success());
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map