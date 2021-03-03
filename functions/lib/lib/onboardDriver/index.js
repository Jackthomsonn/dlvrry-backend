"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardUser = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/user/index");
exports.onboardUser = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    const accountLinkUrl = await index_1.User.onboardUser(request.body);
    response.send(accountLinkUrl);
});
//# sourceMappingURL=index.js.map