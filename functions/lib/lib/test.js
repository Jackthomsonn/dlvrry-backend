"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
exports.Test = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length)
        admin.initializeApp();
    const remoteConfig = await admin.remoteConfig().getTemplate();
    const value = remoteConfig.parameters.application_fee.defaultValue.value;
    response.send(value);
});
//# sourceMappingURL=test.js.map