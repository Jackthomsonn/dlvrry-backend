"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopOnboardingUser = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("../../classes/user/index");
exports.stopOnboardingUser = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    await index_1.User.updateUser(request.body.id, { accountLinkUrl: '', stripeAccountId: '' });
    response.send();
});
//# sourceMappingURL=index.js.map