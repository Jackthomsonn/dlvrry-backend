"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePaymentStatus = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/job/index");
const dlvrry_common_1 = require("dlvrry-common");
exports.handlePaymentStatus = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length)
        admin.initializeApp();
    await index_1.Job.updateJob(request.body.data.object.metadata.id, { charge_id: request.body.data.object.charges.data[0].id, payment_captured: true, status: dlvrry_common_1.JobStatus.PENDING });
    response.send();
});
//# sourceMappingURL=index.js.map