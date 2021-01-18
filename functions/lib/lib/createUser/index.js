"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const index_1 = require("./../../classes/user/index");
exports.createUser = functions.auth.user().onCreate(async (user) => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    try {
        await index_1.User.createUser(user);
        return {};
    }
    catch (e) {
        return { e };
    }
});
//# sourceMappingURL=index.js.map