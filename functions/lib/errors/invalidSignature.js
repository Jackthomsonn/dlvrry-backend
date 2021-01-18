"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidSignature = void 0;
class InvalidSignature extends Error {
    constructor() {
        super();
        this.name = 'InvalidSignature';
        this.message = 'The signature provided was incorrect';
    }
}
exports.InvalidSignature = InvalidSignature;
//# sourceMappingURL=invalidSignature.js.map