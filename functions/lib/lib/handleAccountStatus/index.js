"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAccountStatus = void 0;
const index_1 = require("./../../classes/auth/index");
const index_2 = require("./../../classes/response/index");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_3 = require("./../../classes/user/index");
const dlvrry_common_1 = require("dlvrry-common");
exports.handleAccountStatus = functions.https.onRequest(async (request, response) => {
    var _a;
    if (!admin.apps.length)
        admin.initializeApp();
    try {
        index_1.Auth.verifyWebhook(request);
        const onboardingEvent = request.body;
        const object = onboardingEvent.data.object;
        const possible_disabled_reasons = [
            {
                code: 'requirements.past_due',
                status: dlvrry_common_1.VerificationStatus.PAST_DUE,
            },
            {
                code: 'requirements.pending_verification',
                status: dlvrry_common_1.VerificationStatus.PENDING_VERIFICATION,
            },
            {
                code: 'rejected.fraud',
                status: dlvrry_common_1.VerificationStatus.REJECTED_FRAUDULENT,
            },
            {
                code: 'rejected.terms_of_service',
                status: dlvrry_common_1.VerificationStatus.REJECTED_TERMS_OF_SERVICE,
            },
            {
                code: 'rejected.listed',
                status: dlvrry_common_1.VerificationStatus.REJECTED_LISTED,
            },
            {
                code: 'rejected.other',
                status: dlvrry_common_1.VerificationStatus.REJECTED_OTHER,
            },
            {
                code: 'listed',
                status: dlvrry_common_1.VerificationStatus.LISTED,
            },
            {
                code: 'under_review',
                status: dlvrry_common_1.VerificationStatus.UNDER_REVIEW,
            },
            {
                code: 'other',
                status: dlvrry_common_1.VerificationStatus.OTHER,
            },
        ];
        const disabled_reason = (_a = object.requirements) === null || _a === void 0 ? void 0 : _a.disabled_reason;
        const verification_status = possible_disabled_reasons.find(reason => reason.code === disabled_reason);
        if (disabled_reason !== null) {
            await index_3.User.updateUserWhere({ verification_status: verification_status === null || verification_status === void 0 ? void 0 : verification_status.status }, {
                whereField: 'connected_account_id',
                whereOp: '==',
                whereValue: onboardingEvent.account,
            });
        }
        else {
            await index_3.User.updateUserWhere({ verification_status: dlvrry_common_1.VerificationStatus.COMPLETED }, {
                whereField: 'connected_account_id',
                whereOp: '==',
                whereValue: onboardingEvent.account,
            });
        }
        response.send(index_2.Response.success());
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_2.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map