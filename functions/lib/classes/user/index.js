"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const admin = require("firebase-admin");
const dlvrry_common_1 = require("dlvrry-common");
const userNotFound_1 = require("../../errors/userNotFound");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
class User {
    constructor(name, email, account_type, connected_account_id, account_link_url, verification_status, cancelled_jobs, verified, customer_id, id) {
        this.name = name;
        this.email = email;
        this.account_type = account_type;
        this.connected_account_id = connected_account_id;
        this.account_link_url = account_link_url;
        this.verification_status = verification_status;
        this.cancelled_jobs = cancelled_jobs;
        this.verified = verified;
        this.customer_id = customer_id;
        this.id = id;
    }
    static getConverter() {
        return {
            toFirestore({ name, email, account_type, connected_account_id, account_link_url, verification_status, cancelled_jobs, verified, customer_id, id }) {
                return { name, email, account_type, connected_account_id, account_link_url, verification_status, cancelled_jobs, verified, customer_id, id };
            },
            fromFirestore(snapshot) {
                const { name, email, account_type, connected_account_id, account_link_url, verification_status, cancelled_jobs, verified, customer_id, id } = snapshot.data();
                return new User(name, email, account_type, connected_account_id, account_link_url, verification_status, cancelled_jobs, verified, customer_id, id);
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
    static updateUser(id, user) {
        return admin
            .firestore()
            .collection('users')
            .withConverter(this.getConverter())
            .doc(id)
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
        const customer = await stripe.customers.create({
            email: email,
        });
        await User.updateUser(id, {
            connected_account_id: account.id,
            account_link_url: account_links.url,
            customer_id: customer.id,
        });
        return Promise.resolve(account_links.url);
    }
}
exports.User = User;
//# sourceMappingURL=index.js.map