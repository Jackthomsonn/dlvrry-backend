"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
const unauthorized_1 = require("./../../errors/unauthorized");
const admin = require("firebase-admin");
const jobNotFound_1 = require("./../../errors/jobNotFound");
const jobTaken_1 = require("./../../errors/jobTaken");
const stripe_1 = require("stripe");
const index_1 = require("./../user/index");
const userNotFound_1 = require("./../../errors/userNotFound");
const dlvrry_common_1 = require("dlvrry-common");
const geocoder = require("node-geocoder");
const moment = require("moment");
const functions = require("firebase-functions");
const stripe = require('stripe')(functions.config().dlvrry.stripe_secret);
class Job {
    constructor(created, owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, customer_location_name, payment_captured, status, id, charge_id) {
        this.created = created;
        this.owner_name = owner_name;
        this.owner_id = owner_id;
        this.rider_id = rider_id;
        this.customer_location = customer_location;
        this.pickup_location = pickup_location;
        this.number_of_items = number_of_items;
        this.payout = payout;
        this.cost = cost;
        this.customer_location_name = customer_location_name;
        this.payment_captured = payment_captured;
        this.status = status;
        this.id = id;
        this.charge_id = charge_id;
    }
    static getConverter() {
        return {
            toFirestore({ created, owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, customer_location_name, payment_captured, status, id, charge_id }) {
                return { created, owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, customer_location_name, payment_captured, status, id, charge_id };
            },
            fromFirestore(snapshot) {
                const { created, owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, customer_location_name, payment_captured, status, id, charge_id } = snapshot.data();
                return new Job(created, owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, customer_location_name, payment_captured, status, id, charge_id);
            },
        };
    }
    static getJobs(whereField, whereOp, whereValue) {
        var _a;
        return admin
            .firestore()
            .collection('jobs')
            .withConverter(this.getConverter())
            .where((_a = (whereField && whereOp && whereValue)) !== null && _a !== void 0 ? _a : 'status', '==', dlvrry_common_1.JobStatus.PENDING)
            .get();
    }
    static getJob(id) {
        return admin
            .firestore()
            .collection('jobs')
            .withConverter(this.getConverter())
            .doc(id)
            .get();
    }
    static async completeJob(job, token) {
        if (!job.id) {
            throw new jobNotFound_1.JobNotFound();
        }
        const job_doc = await Job.getJob(job.id);
        const job_doc_data = job_doc.data();
        if (!job_doc_data) {
            throw new jobNotFound_1.JobNotFound();
        }
        const rider_doc = await index_1.User.getUser(job_doc_data.rider_id);
        const rider_doc_data = rider_doc.data();
        if (!rider_doc_data) {
            throw new userNotFound_1.UserNotFound();
        }
        if (token.uid !== rider_doc_data.id) {
            throw new unauthorized_1.Unauthorized();
        }
        const owner_doc = await index_1.User.getUser(job_doc_data.owner_id);
        const owner_doc_data = owner_doc.data();
        if (!owner_doc_data) {
            throw new userNotFound_1.UserNotFound();
        }
        await this.transferFunds(job_doc_data, rider_doc_data);
        return await Job.updateJob(job.id, { id: job.id, status: dlvrry_common_1.JobStatus.COMPLETED });
    }
    static async updateJob(id, job) {
        return await admin
            .firestore()
            .collection('jobs')
            .withConverter(Job.getConverter())
            .doc(id)
            .update(job);
    }
    static async createJob(job, owner_id) {
        var _a, _b, _c, _d, _e;
        const business = await index_1.User.getUser(owner_id);
        const business_data = business.data();
        if (!business_data) {
            throw new userNotFound_1.UserNotFound();
        }
        const payout = await this.calculateFee(job.cost);
        const locationName = await Job.getLocationName(job.customer_location.latitude, job.customer_location.longitude);
        job.customer_location_name = `${locationName[0].streetNumber}, ${locationName[0].streetName}`;
        job.rider_id = '';
        job.status = dlvrry_common_1.JobStatus.AWAITING_PAYMENT;
        job.owner_id = owner_id;
        job.owner_name = business_data.name;
        job.pickup_location = new admin.firestore.GeoPoint(job.pickup_location.latitude, job.pickup_location.longitude);
        job.customer_location = new admin.firestore.GeoPoint(job.customer_location.latitude, job.customer_location.longitude);
        job.charge_id = '';
        job.payment_captured = false;
        job.payout = payout;
        job.created = moment().toISOString();
        const doc = admin
            .firestore()
            .collection('jobs')
            .doc();
        job.id = doc.id;
        await doc
            .withConverter(Job.getConverter())
            .create(job);
        const job_doc = await Job.getJob(job.id);
        const job_doc_data = job_doc.data();
        if (!job_doc_data) {
            throw new jobNotFound_1.JobNotFound();
        }
        const owner_doc = await index_1.User.getUser(job_doc_data.owner_id);
        const owner_doc_data = owner_doc.data();
        if (!owner_doc_data) {
            throw new userNotFound_1.UserNotFound();
        }
        try {
            const paymentIntent = await Job.createPayment(job_doc_data, owner_doc_data);
            await Job.updateJob(job.id, { charge_id: paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.charges.data[0].id, payment_captured: true, status: dlvrry_common_1.JobStatus.PENDING });
            return Promise.resolve({
                completed: true,
            });
        }
        catch (e) {
            if (e instanceof stripe_1.default.errors.StripeCardError) {
                await Job.updateJob(job.id, { charge_id: (_a = e.payment_intent) === null || _a === void 0 ? void 0 : _a.charges.data[0].id, payment_captured: false, status: dlvrry_common_1.JobStatus.AWAITING_PAYMENT });
                return Promise.resolve({
                    completed: false,
                    client_secret: (_b = e.payment_intent) === null || _b === void 0 ? void 0 : _b.client_secret,
                    payment_method_id: (_e = (_d = (_c = e.payment_intent) === null || _c === void 0 ? void 0 : _c.last_payment_error) === null || _d === void 0 ? void 0 : _d.payment_method) === null || _e === void 0 ? void 0 : _e.id,
                });
            }
            return;
        }
    }
    static async acceptJob(id, rider_id) {
        var _a;
        try {
            const jobDoc = admin
                .firestore()
                .collection('jobs')
                .withConverter(this.getConverter())
                .doc(id);
            const jobDocData = await jobDoc.get();
            if (((_a = jobDocData.data()) === null || _a === void 0 ? void 0 : _a.status) === dlvrry_common_1.JobStatus.IN_PROGRESS) {
                throw new jobTaken_1.JobTaken();
            }
            return await jobDoc
                .update({
                status: dlvrry_common_1.JobStatus.IN_PROGRESS,
                rider_id: rider_id,
            });
        }
        catch (e) {
            throw e;
        }
    }
    static async cancelJob(id, token) {
        const job = await Job.getJob(id);
        const user = await index_1.User.getUser(token.uid);
        const job_data = job.data();
        const user_data = user.data();
        if (token.uid === (job_data === null || job_data === void 0 ? void 0 : job_data.owner_id)) {
            await Job.updateJob(id, { status: dlvrry_common_1.JobStatus.CANCELLED_BY_OWNER });
            return Promise.resolve();
        }
        else if (token.uid === (job_data === null || job_data === void 0 ? void 0 : job_data.rider_id)) {
            const rider_id = job_data === null || job_data === void 0 ? void 0 : job_data.rider_id;
            if (!rider_id) {
                throw new userNotFound_1.UserNotFound();
            }
            await Job.updateJob(id, { status: dlvrry_common_1.JobStatus.CANCELLED });
            if (user_data === null || user_data === void 0 ? void 0 : user_data.cancelled_jobs) {
                await index_1.User.updateUser(rider_id, { cancelled_jobs: (user_data === null || user_data === void 0 ? void 0 : user_data.cancelled_jobs) + 1 });
                return Promise.resolve();
            }
        }
        else {
            throw new unauthorized_1.Unauthorized();
        }
    }
    static async transferFunds(job, rider_doc) {
        if (!(rider_doc === null || rider_doc === void 0 ? void 0 : rider_doc.id)) {
            throw new userNotFound_1.UserNotFound();
        }
        return stripe.transfers.create({
            source_transaction: job.charge_id,
            currency: 'gbp',
            amount: job.payout,
            destination: rider_doc.connected_account_id,
        });
    }
    static async createPayment(job, owner_doc) {
        var _a;
        const stripe_customer = await stripe.customers.retrieve(owner_doc.customer_id);
        const customer = stripe_customer;
        if ((_a = customer === null || customer === void 0 ? void 0 : customer.invoice_settings) === null || _a === void 0 ? void 0 : _a.default_payment_method) {
            return stripe.paymentIntents.create({
                amount: job.cost,
                payment_method: customer.invoice_settings.default_payment_method,
                customer: owner_doc.customer_id,
                currency: 'gbp',
                confirm: true,
                off_session: true,
                metadata: {
                    id: (job === null || job === void 0 ? void 0 : job.id) || '',
                },
            });
        }
        return;
    }
    static async calculateFee(cost) {
        const remoteConfig = await admin.remoteConfig().getTemplate();
        const feePercent = remoteConfig.parameters.application_fee.defaultValue.value;
        const flatFee = remoteConfig.parameters.flat_fee.defaultValue.value;
        const amountAfterPayoutFee = cost - Math.floor((cost / 100) * Number(feePercent) + Number(flatFee));
        return Promise.resolve(Number(amountAfterPayoutFee.toFixed(0)));
    }
    static async getLocationName(lat, lon) {
        const geocode = geocoder({
            provider: 'google',
            apiKey: functions.config().dlvrry.g_api_key,
        });
        return geocode.reverse({ lat, lon });
    }
}
exports.Job = Job;
//# sourceMappingURL=index.js.map