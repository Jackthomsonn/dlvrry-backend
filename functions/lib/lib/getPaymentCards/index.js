"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentCards = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/response/index");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
exports.getPaymentCards = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    try {
        const paymentMethods = await stripe.paymentMethods.list({
            customer: request.body.customer_id,
            type: 'card',
        });
        response.send(index_1.Response.success(paymentMethods.data));
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map