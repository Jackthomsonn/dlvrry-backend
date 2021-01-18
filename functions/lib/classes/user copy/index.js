"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const admin = require("firebase-admin");
const dlvrry_common_1 = require("@dlvrry/dlvrry-common");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
class User {
    constructor(name, email, account_type, connected_account_id, account_link_url, verification_status, verified, customer_id) {
        this.name = name;
        this.email = email;
        this.account_type = account_type;
        this.connected_account_id = connected_account_id;
        this.account_link_url = account_link_url;
        this.verification_status = verification_status;
        this.verified = verified;
        this.customer_id = customer_id;
        this.id = '';
    }
    static getConverter() {
        return {
            toFirestore({ name, email, account_type, connected_account_id, account_link_url, customer_id, verification_status, verified }) {
                return { name, email, account_type, connected_account_id, account_link_url, customer_id, verification_status, verified };
            },
            fromFirestore(snapshot) {
                const { name, email, account_type, connected_account_id, account_link_url, customer_id, verification_status, verified } = snapshot.data();
                return new User(name, email, account_type, connected_account_id, account_link_url, verification_status, verified, customer_id);
            },
        };
    }
    static getUsers() {
        return new Promise(resolve => {
            admin
                .firestore()
                .collection('users')
                .withConverter(this.getConverter())
                .onSnapshot(async (response) => {
                const collection = [];
                for (const user of response.docs) {
                    collection.push(user.data());
                }
                resolve(collection);
            });
        });
    }
    static getUser(id) {
        return new Promise(resolve => {
            admin
                .firestore()
                .collection('users')
                .doc(id)
                .withConverter(this.getConverter())
                .onSnapshot(async (response) => {
                resolve(response.data());
            });
        });
    }
    static updateUser(id, user) {
        return admin
            .firestore()
            .collection('users')
            .doc(id)
            .update(user);
    }
    static createUser(user) {
        return admin
            .firestore()
            .collection('users')
            .doc(user.uid)
            .withConverter(this.getConverter())
            .create({
            id: user.uid,
            name: user.displayName || '',
            email: user.email || '',
            connected_account_id: '',
            account_link_url: '',
            account_type: dlvrry_common_1.AccountType.NONE,
            customer_id: '',
            verification_status: dlvrry_common_1.VerificationStatus.PENDING,
            verified: false,
        });
    }
    static async getUserLoginLink(id) {
        const user = await User.getUser(id);
        const account = await stripe.accounts.retrieve(user.connected_account_id);
        return await stripe.accounts.createLoginLink(account.id);
    }
    static async onboardUser(request) {
        const { id, email, refreshUrl, returnUrl } = request;
        const user = await User.getUser(id);
        if (user && user.connected_account_id) {
            return Promise.resolve(user.account_link_url);
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