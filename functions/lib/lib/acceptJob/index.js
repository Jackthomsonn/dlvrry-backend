"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptJob = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/auth/index");
const job_1 = require("../../classes/job");
const index_2 = require("../../classes/response/index");
exports.acceptJob = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length)
        admin.initializeApp();
    try {
        await index_1.Auth.verify(request);
        await job_1.Job.acceptJob(request.body.id, request.body.rider_id);
        response.send(index_2.Response.success());
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_2.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map