"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectedAccountDetails = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/auth/index");
const index_2 = require("./../../classes/response/index");
const index_3 = require("../../classes/user/index");
exports.getConnectedAccountDetails = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length)
        admin.initializeApp();
    try {
        await index_1.Auth.verify(request);
        const result = await index_3.User.getConnectedAccountDetails(request);
        response.send(index_2.Response.success(result));
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_2.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map