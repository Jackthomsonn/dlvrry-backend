"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardUser = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const auth_1 = require("../../classes/auth");
const index_1 = require("./../../classes/response/index");
const index_2 = require("../../classes/user/index");
exports.onboardUser = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length)
        admin.initializeApp();
    try {
        await auth_1.Auth.verify(request);
        const accountLinkUrl = await index_2.User.onboardUser(request.body);
        response.send(index_1.Response.success(accountLinkUrl));
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map