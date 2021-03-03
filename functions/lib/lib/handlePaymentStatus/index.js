"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePaymentStatus = void 0;
const index_1 = require("./../../classes/auth/index");
const index_2 = require("./../../classes/response/index");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_3 = require("./../../classes/job/index");
const dlvrry_common_1 = require("dlvrry-common");
exports.handlePaymentStatus = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length)
        admin.initializeApp();
    try {
        index_1.Auth.verifyWebhook(request);
        const onboardingEvent = request.body;
        const object = onboardingEvent.data.object;
        await index_3.Job.updateJob(object.metadata.id, { charge_id: object.charges.data[0].id, payment_captured: true, status: dlvrry_common_1.JobStatus.PENDING });
        response.send(index_2.Response.success());
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_2.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map