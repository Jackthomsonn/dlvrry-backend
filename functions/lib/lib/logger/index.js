"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
exports.createUser = functions.firestore.document('/users/*').on(async (user) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    await User.createUser(user);
    return { completed: true };
});
//# sourceMappingURL=index.js.map