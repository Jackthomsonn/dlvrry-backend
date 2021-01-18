"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAccountLink = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/response/index");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
exports.refreshAccountLink = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    try {
        const params = request.query;
        const accountLinks = await stripe.accountLinks.create({
            account: params.account,
            refresh_url: `${functions.config().dlvrry.functions_url}/refreshAccountLink?account=${params.account}`,
            return_url: functions.config().dlvrry.return_url,
            type: 'account_onboarding',
        });
        response.redirect(accountLinks.url);
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map