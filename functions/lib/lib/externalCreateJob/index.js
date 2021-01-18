"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalCreateJob = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const key_1 = require("../../classes/key");
const index_1 = require("./../../classes/response/index");
const cors_1 = require("../../utils/cors");
exports.externalCreateJob = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    if (request.method === 'OPTIONS') {
        cors_1.handleCors(response);
    }
    try {
        const parsedBody = JSON.parse(request.body);
        const result = await key_1.Key.validateKey(parsedBody);
        response.send(index_1.Response.success(result));
    }
    catch (e) {
        response.status(500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map