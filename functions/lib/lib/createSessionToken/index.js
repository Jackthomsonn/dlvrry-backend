"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionToken = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/response/index");
const uuid_1 = require("uuid");
exports.createSessionToken = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    try {
        response.send(index_1.Response.success(uuid_1.v4()));
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map