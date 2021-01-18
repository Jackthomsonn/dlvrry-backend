"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectedAccountDetails = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/response/index");
const index_2 = require("../../classes/user/index");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
exports.getConnectedAccountDetails = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    try {
        const user = await index_2.User.getUser(request.body.id);
        const user_data = user.data();
        if (!user_data) {
            response.status(404).send(index_1.Response.fail({ status: 404, message: 'No user found' }));
        }
        else {
            const account = await stripe.accounts.retrieve(user_data.connected_account_id);
            response.send(index_1.Response.success(account));
        }
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map