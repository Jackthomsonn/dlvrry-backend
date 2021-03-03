"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Key = void 0;
const admin = require("firebase-admin");
const moment = require("moment");
const crypto_1 = require("crypto");
const invalidSignature_1 = require("./../../errors/invalidSignature");
const job_1 = require("../job");
const keyNotFound_1 = require("./../../errors/keyNotFound");
class Key {
    constructor(key, id) {
        this.key = key;
        this.id = id;
    }
    static getConverter() {
        return {
            toFirestore({ key, id }) {
                return { key, id };
            },
            fromFirestore(snapshot) {
                const { key, id } = snapshot.data();
                return new Key(key, id);
            },
        };
    }
    static getKey(id) {
        return admin
            .firestore()
            .collection('keys')
            .withConverter(this.getConverter())
            .doc(id)
            .get();
    }
    static updateKey(id, newKey) {
        return admin
            .firestore()
            .collection('keys')
            .doc(id)
            .update(newKey);
    }
    static createKey(key) {
        return admin
            .firestore()
            .collection('keys')
            .withConverter(this.getConverter())
            .doc()
            .create(key);
    }
    static async validateKey(body) {
        const keyResponse = await admin
            .firestore()
            .collection('keys')
            .withConverter(this.getConverter())
            .doc(body.platform_id)
            .get();
        const keyData = keyResponse.data();
        if (!keyData) {
            throw new keyNotFound_1.KeyNotFound();
        }
        const data = Object.assign(Object.assign({}, body.job), { timestamp: body.timestamp });
        const computedHmac = crypto_1.createHmac('sha512', keyData.key).update(JSON.stringify(data)).digest('hex');
        crypto_1.timingSafeEqual(Buffer.from(computedHmac, 'utf8'), Buffer.from(body.token, 'utf8'));
        if (computedHmac !== body.token || moment().diff(body.timestamp, 'seconds') > 10) {
            throw new invalidSignature_1.InvalidSignature();
        }
        else {
            await job_1.Job.createJob(body.job, body.job.owner_id);
            return Promise.resolve();
        }
    }
}
exports.Key = Key;
//# sourceMappingURL=index.js.map