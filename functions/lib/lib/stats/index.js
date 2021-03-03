"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stats = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
exports.stats = functions.firestore.on('users').onWrite(async (change, ctx) => {
    if (!admin.apps.length)
        admin.initializeApp();
    const doc = admin.firestore().collection('stats').doc('1');
    const doc_data = await doc.get();
    return admin.firestore().collection('stats').doc('1').update({ read_ops: doc_data.data().read_ops + 1 });
});
//# sourceMappingURL=index.js.map