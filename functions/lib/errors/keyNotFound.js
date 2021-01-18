"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyNotFound = void 0;
class KeyNotFound extends Error {
    constructor() {
        super();
        this.name = 'KeyNotFound';
        this.message = 'Key Not Found ';
    }
}
exports.KeyNotFound = KeyNotFound;
//# sourceMappingURL=keyNotFound.js.map