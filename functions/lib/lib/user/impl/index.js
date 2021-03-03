"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
require("firebase/firestore");
const axios_1 = require("axios");
class User {
    constructor(name, email, stripeAccountId) {
        this.name = name;
        this.email = email;
        this.stripeAccountId = stripeAccountId;
    }
    static getConverter() {
        return {
            toFirestore({ name, email, stripeAccountId }) {
                return { name, email, stripeAccountId };
            },
            fromFirestore(snapshot, options) {
                const { name, email, stripeAccountId } = snapshot.data(options);
                return new User(name, email, stripeAccountId);
            }
        };
    }
    static getUserDetails(docId) {
        return axios_1.default.post('https://dlivrr-functions.ngrok.io/portage-33018/us-central1/getUserStatus', { docId });
    }
}
exports.User = User;
//# sourceMappingURL=index.js.map