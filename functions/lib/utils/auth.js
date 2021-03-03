"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateRequest = void 0;
const admin = require("firebase-admin");
const unauthorized_1 = require("./../errors/unauthorized");
exports.ValidateRequest = async (request) => {
    try {
        if (!request.headers.authorization) {
            throw new unauthorized_1.Unauthorized();
        }
        const token = await admin.auth().verifyIdToken(request.headers.authorization, true);
        return Promise.resolve(token);
    }
    catch (e) {
        throw e;
    }
};
//# sourceMappingURL=auth.js.map