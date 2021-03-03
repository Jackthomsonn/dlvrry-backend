"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const dlvrry_common_1 = require("dlvrry-common");
const userNotFound_1 = require("../../errors/userNotFound");
const stripe = require('stripe')(functions.config().dlvrry.stripe_secret);
class User {
    constructor(name, email, account_type, connected_account_id, account_link_url, verification_status, cancelled_jobs, verified, customer_id, mode, id) {
        this.name = name;
        this.email = email;
        this.account_type = account_type;
        this.connected_account_id = connected_account_id;
        this.account_link_url = account_link_url;
        this.verification_status = verification_status;
        this.cancelled_jobs = cancelled_jobs;
        this.verified = verified;
        this.customer_id = customer_id;
        this.mode = mode;
        this.id = id;
    }
    static getConverter() {
        return {
            toFirestore({ name, email, account_type, connected_account_id, account_link_url, verification_status, cancelled_jobs, verified, customer_id, mode, id }) {
                return { name, email, account_type, connected_account_id, account_link_url, verification_status, cancelled_jobs, verified, customer_id, mode, id };
            },
            fromFirestore(snapshot) {
                const { name, email, account_type, connected_account_id, account_link_url, verification_status, cancelled_jobs, verified, customer_id, mode, id } = snapshot.data();
                return new User(name, email, account_type, connected_account_id, account_link_url, verification_status, cancelled_jobs, verified, customer_id, mode, id);
            },
        };
    }
    static getUsers() {
        return admin
            .firestore()
            .collection('users')
            .withConverter(this.getConverter())
            .get();
    }
    static getUser(id) {
        return admin
            .firestore()
            .collection('users')
            .withConverter(this.getConverter())
            .doc(id)
            .get();
    }
    static async updateUser(id, user) {
        return admin
            .firestore()
            .collection('users')
            .withConverter(this.getConverter())
            .doc(id)
            .update(user);
    }
    static async updateUserWhere(user, where) {
        const userDoc = await admin
            .firestore()
            .collection('users')
            .where(where.whereField, where.whereOp, where.whereValue)
            .withConverter(this.getConverter())
            .get();
        return admin
            .firestore()
            .collection('users')
            .withConverter(this.getConverter())
            .doc(userDoc.docs[0].data().id || '')
            .update(user);
    }
    static createUser(user) {
        return admin
            .firestore()
            .collection('users')
            .withConverter(this.getConverter())
            .doc(user.uid)
            .create({
            id: user.uid,
            name: user.displayName || '',
            email: user.email || '',
            connected_account_id: '',
            account_link_url: '',
            account_type: dlvrry_common_1.AccountType.NONE,
            customer_id: '',
            verification_status: dlvrry_common_1.VerificationStatus.PENDING,
            cancelled_jobs: 0,
            verified: false,
            mode: dlvrry_common_1.ModeType.NOT_APPLICABLE,
        });
    }
    static async getUserLoginLink(id) {
        const user = await User.getUser(id);
        const userData = user === null || user === void 0 ? void 0 : user.data();
        if (!userData) {
            throw new userNotFound_1.UserNotFound();
        }
        const account = await stripe.accounts.retrieve(userData.connected_account_id);
        return await stripe.accounts.createLoginLink(account.id);
    }
    static async onboardUser(request) {
        const { id, email, refreshUrl, returnUrl } = request;
        const user = await User.getUser(id);
        const userData = user === null || user === void 0 ? void 0 : user.data();
        if (!userData) {
            throw new userNotFound_1.UserNotFound();
        }
        if (userData.connected_account_id) {
            return Promise.resolve(userData.account_link_url);
        }
        const account = await stripe.accounts.create({
            type: 'express',
            email: email,
            country: 'gb',
            default_currency: 'gbp',
        });
        const account_links = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${refreshUrl}?account=${account.id}`,
            return_url: returnUrl,
            type: 'account_onboarding',
        });
        await User.updateUser(id, {
            connected_account_id: account.id,
            account_link_url: account_links.url,
        });
        return Promise.resolve(account_links.url);
    }
    static async addPaymentMethod(request) {
        const payment_method_id = request.query.id;
        const customer_id = request.query.customer_id;
        await stripe.paymentMethods.attach(payment_method_id, { customer: customer_id });
        await stripe.customers.update(customer_id, {
            invoice_settings: {
                default_payment_method: payment_method_id,
            },
        });
        const paymentIntent = await stripe.setupIntents.create({
            payment_method: payment_method_id,
            customer: customer_id,
            confirm: true,
        });
        if (paymentIntent.next_action) {
            return Promise.resolve({
                completed: false,
                payment_method: paymentIntent.payment_method,
                client_secret: paymentIntent.client_secret,
            });
        }
        else {
            return Promise.resolve({ completed: true });
        }
    }
    static async getConnectedAccountDetails(request) {
        const user = await User.getUser(request.body.id);
        const user_data = user.data();
        if (!user_data) {
            return Promise.reject({ status: 404, message: 'No user found' });
        }
        else {
            const account = await stripe.accounts.retrieve(user_data.connected_account_id);
            return Promise.resolve(account);
        }
    }
    static async getPaymentMethods(request) {
        const paymentMethods = await stripe.paymentMethods.list({
            customer: request.body.customer_id,
            type: 'card',
        });
        const customer = await stripe.customers.retrieve(request.body.customer_id);
        const result = paymentMethods.data.map(paymentMethod => {
            var _a, _b;
            return {
                brand: (_a = paymentMethod.card) === null || _a === void 0 ? void 0 : _a.brand,
                last4: (_b = paymentMethod.card) === null || _b === void 0 ? void 0 : _b.last4,
                is_default_payment_method: customer.invoice_settings.default_payment_method === paymentMethod.id,
            };
        });
        return Promise.resolve(result);
    }
    static async refreshAccountLink(request) {
        const params = request.query;
        const accountLinks = await stripe.accountLinks.create({
            account: params.account,
            refresh_url: `${functions.config().dlvrry.functions_url}/refreshAccountLink?account=${params.account}`,
            return_url: functions.config().dlvrry.return_url,
            type: 'account_onboarding',
        });
        return Promise.resolve(accountLinks.url);
    }
}
exports.User = User;
//# sourceMappingURL=index.js.map