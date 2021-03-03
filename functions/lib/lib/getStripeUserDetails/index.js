"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripeUserDetails = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("../../classes/user/index");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
exports.getStripeUserDetails = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    const user = await index_1.User.getUser(request.body.id);
    if (user) {
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        response.send(account);
    }
    else {
        response.send('No user exists');
    }
});
//# sourceMappingURL=index.js.map