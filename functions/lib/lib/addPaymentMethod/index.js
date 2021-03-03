"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPaymentMethod = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/response/index");
const index_2 = require("./../../classes/user/index");
exports.addPaymentMethod = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length)
        admin.initializeApp();
    response.set('Access-Control-Allow-Origin', '*');
    if (request.method === 'OPTIONS') {
        response.set('Access-Control-Allow-Methods', 'POST');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('');
    }
    try {
        const result = await index_2.User.addPaymentMethod(request);
        response.send(index_1.Response.success(result));
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map