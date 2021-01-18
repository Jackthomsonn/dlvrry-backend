"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
require("admin/firestore");
const index_1 = require("../../../enums/status/index");
const admin_admin_1 = require("admin-admin");
class Job {
    constructor(businessId, businessName, driverId, driverName, location, numberOfItems, payout, status) {
        this.businessId = businessId;
        this.businessName = businessName;
        this.driverId = driverId;
        this.driverName = driverName;
        this.location = location;
        this.numberOfItems = numberOfItems;
        this.payout = payout;
        this.status = status;
    }
    static getConverter() {
        return {
            toFirestore({ businessId, driverId, location, numberOfItems, payout, status }) {
                return { businessId, driverId, location, numberOfItems, payout, status };
            },
            fromFirestore(snapshot, options) {
                const { businessId, businessName, driverId, driverName, location, numberOfItems, payout, status } = snapshot.data(options);
                return new Job(businessId, businessName, driverId, driverName, location, numberOfItems, payout, status);
            }
        };
    }
    static getCollection() {
        return new Promise(resolve => {
            admin_admin_1.default.firestore().collection('jobs').withConverter(this.getConverter()).where('status', '==', index_1.Status.AWAITING_ACCEPTANCE).onSnapshot(async (response) => {
                const collection = [];
                for (const job of response.docs) {
                    collection.push(Object.assign({ id: job.id }, job.data()));
                }
                resolve(collection);
            });
        });
    }
    static getDocument(docId) {
        return new Promise(resolve => {
            admin_admin_1.default.firestore().collection('jobs').doc(docId).withConverter(this.getConverter()).onSnapshot(response => {
                resolve(response.data());
            });
        });
    }
    static acceptJob(docId) {
        admin_admin_1.default.firestore().collection('jobs').doc(docId).update({ status: index_1.Status.IN_PROGRESS });
    }
}
exports.Job = Job;
//# sourceMappingURL=index.js.map