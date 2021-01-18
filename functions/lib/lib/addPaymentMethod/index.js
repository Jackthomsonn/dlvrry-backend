"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPaymentMethod = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/response/index");
const cors_1 = require("../../utils/cors");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
exports.addPaymentMethod = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    response.set('Access-Control-Allow-Origin', '*');
    if (request.method === 'OPTIONS') {
        cors_1.handleCors(response);
    }
    try {
        const payment_method_id = request.query.id;
        const customer_id = request.query.customer_id;
        await stripe.paymentMethods.attach(payment_method_id, { customer: customer_id });
        await stripe.customers.update(customer_id, {
            invoice_settings: {
                default_payment_method: payment_method_id
            }
        });
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 100,
            payment_method: payment_method_id,
            customer: customer_id,
            confirm: true,
            currency: 'gbp',
            setup_future_usage: 'off_session'
        });
        if (paymentIntent.next_action) {
            response.send(index_1.Response.success({
                completed: false,
                payment_method: paymentIntent.payment_method,
                client_secret: paymentIntent.client_secret,
            }));
        }
        else {
            response.send(index_1.Response.success({ completed: true }));
        }
    }
    catch (e) {
        response.status(e.status ? e.status : 500).send(index_1.Response.fail(e));
    }
});
//# sourceMappingURL=index.js.map