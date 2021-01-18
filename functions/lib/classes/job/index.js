"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
const admin = require("firebase-admin");
const dlvrry_common_1 = require("dlvrry-common");
const jobNotFound_1 = require("./../../errors/jobNotFound");
const index_1 = require("./../user/index");
const userNotFound_1 = require("./../../errors/userNotFound");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
class Job {
    constructor(owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, status, id) {
        this.owner_name = owner_name;
        this.owner_id = owner_id;
        this.rider_id = rider_id;
        this.customer_location = customer_location;
        this.pickup_location = pickup_location;
        this.number_of_items = number_of_items;
        this.payout = payout;
        this.cost = cost;
        this.status = status;
        this.id = id;
    }
    static getConverter() {
        return {
            toFirestore({ owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, status, id }) {
                return { owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, status, id };
            },
            fromFirestore(snapshot) {
                const { owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, status, id } = snapshot.data();
                return new Job(owner_name, owner_id, rider_id, customer_location, pickup_location, number_of_items, payout, cost, status, id);
            },
        };
    }
    static getJobs() {
        return admin
            .firestore()
            .collection('jobs')
            .withConverter(this.getConverter())
            .where('status', '==', dlvrry_common_1.JobStatus.PENDING)
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
    static async completeJob(job) {
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
        const owner_doc = await index_1.User.getUser(job_doc_data.owner_id);
        const owner_doc_data = owner_doc.data();
        if (!owner_doc_data) {
            throw new userNotFound_1.UserNotFound();
        }
        await Job.createPaymentIntent(job_doc_data, rider_doc_data, owner_doc_data);
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
        const business = await index_1.User.getUser(owner_id);
        const business_data = business.data();
        if (!business_data) {
            throw new userNotFound_1.UserNotFound();
        }
        job.rider_id = '';
        job.status = dlvrry_common_1.JobStatus.PENDING;
        job.owner_id = owner_id;
        job.owner_name = business_data.name;
        job.pickup_location = new admin.firestore.GeoPoint(job.pickup_location.latitude, job.pickup_location.longitude);
        job.customer_location = new admin.firestore.GeoPoint(job.customer_location.latitude, job.customer_location.longitude);
        const doc = admin
            .firestore()
            .collection('jobs')
            .doc();
        job.id = doc.id;
        return await doc
            .withConverter(Job.getConverter())
            .create(job);
    }
    static async createPaymentIntent(job, rider_doc, owner_doc) {
        const remoteConfig = admin.remoteConfig();
        const config = await remoteConfig.getTemplate();
        const fee = Number(config.parameters.application_fee.defaultValue.value);
        const APPLICATION_FEE = Math.floor(fee * job.cost / 100 + 20);
        const stripe_customer_object = await stripe.customers.retrieve(owner_doc.customer_id);
        return stripe.paymentIntents.create({
            amount: job.cost,
            application_fee_amount: APPLICATION_FEE,
            payment_method_types: ['card'],
            payment_method: stripe_customer_object.invoice_settings.default_payment_method,
            confirm: true,
            customer: owner_doc.customer_id,
            currency: 'gbp',
            transfer_data: {
                destination: rider_doc.connected_account_id,
            },
            off_session: true
        });
    }
}
exports.Job = Job;
//# sourceMappingURL=index.js.map