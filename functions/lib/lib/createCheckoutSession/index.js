"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
exports.createCheckoutSession = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }
    const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
                name: 'Test',
                amount: 200,
                currency: 'gbp',
                quantity: 1,
            }],
        success_url: 'https://auth.expo.io/@jackthomson/dlvrry',
        cancel_url: 'https://auth.expo.io/@jackthomson/dlvrry',
    });
    response.redirect(checkoutSession.id);
});
//# sourceMappingURL=index.js.map