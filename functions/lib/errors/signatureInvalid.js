"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureInvalid = void 0;
class SignatureInvalid extends Error {
    constructor() {
        super();
        this.name = 'SignatureInvalid';
        this.message = 'The signature provided was incorrect';
    }
}
exports.SignatureInvalid = SignatureInvalid;
//# sourceMappingURL=signatureInvalid.js.map