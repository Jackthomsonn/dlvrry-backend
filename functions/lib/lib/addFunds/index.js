"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFunds = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
exports.addFunds = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', "*");
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    const intent = await stripe.paymentIntents.create({
        amount: Number(request.query.amount),
        currency: 'gbp',
        metadata: { integration_check: 'accept_a_payment' },
    });
    response.send(intent.client_secret);
});
//# sourceMappingURL=index.js.map