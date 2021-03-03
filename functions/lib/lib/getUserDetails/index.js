"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDetails = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/user/index");
const stripe = require('stripe')('sk_test_51Hu360ECTL6k6a8r7aHfeawdzDCf7ppGgVKwvG5tZR9wgFMqzWfMIKln7CByurQIvDhlyuy0HOFFTj3mHM3NEA8x00g0wWPWn1');
exports.getUserDetails = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    const user = await index_1.User.getUser(request.body.id);
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    response.send(account);
});
//# sourceMappingURL=index.js.map