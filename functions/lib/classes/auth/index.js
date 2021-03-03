"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const unauthorized_1 = require("../../errors/unauthorized");
class Auth {
    static async verify(request) {
        try {
            if (!request.headers.authorization)
                throw new unauthorized_1.Unauthorized();
            const token = await admin.auth().verifyIdToken(request.headers.authorization, true);
            return Promise.resolve(token);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    static verifyWebhook(request) {
        const stripe = require('stripe')(functions.config().dlvrry.stripe_secret);
        const signature = request.headers['stripe-signature'];
        stripe.webhooks.constructEvent(request['rawBody'], signature, functions.config().dlvrry.account_status_secret);
    }
}
exports.Auth = Auth;
//# sourceMappingURL=index.js.map