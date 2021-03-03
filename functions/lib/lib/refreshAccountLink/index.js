"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAccountLink = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/response/index");
const index_2 = require("./../../classes/user/index");
exports.refreshAccountLink = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length)
        admin.initializeApp();
    try {
        const accountLinkUrl = await index_2.User.refreshAccountLink(request);
        response.redirect(accountLinkUrl);
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map