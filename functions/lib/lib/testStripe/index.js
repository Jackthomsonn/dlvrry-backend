"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testStripe = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
exports.testStripe = functions.https.onRequest(async (request, response) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    const docs = await admin.firestore().collection('jobs').get();
    docs.docs.forEach(async (doc) => {
        await admin.firestore().collection('jobs').doc(doc.id).delete();
    });
});
//# sourceMappingURL=index.js.map