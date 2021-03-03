"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const firebase_functions_rate_limiter_1 = require("firebase-functions-rate-limiter");
const index_1 = require("./../../classes/user/index");
const stripe = require('stripe')(functions.config().dlvrry.stripe_secret);
exports.createUser = functions.auth.user().onCreate(async (user) => {
    if (!admin.apps.length)
        admin.initializeApp();
    const limiter = firebase_functions_rate_limiter_1.FirebaseFunctionsRateLimiter.withFirestoreBackend({
        name: 'user_creation_limiter',
        maxCalls: 2,
        periodSeconds: 10,
    }, admin.firestore());
    await limiter.rejectOnQuotaExceededOrRecordUsage();
    try {
        await index_1.User.createUser(user);
        const customer = await stripe.customers.create({
            email: user.email,
        });
        await index_1.User.updateUser(user.uid, {
            customer_id: customer.id,
        });
        return;
    }
    catch (e) {
        return { status: 500, message: e.message };
    }
});
//# sourceMappingURL=index.js.map