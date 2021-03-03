"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyNotFound = void 0;
class KeyNotFound extends Error {
    constructor() {
        super();
        this.status = 404;
        this.name = 'KeyNotFound';
        this.message = 'Key not found ';
    }
}
exports.KeyNotFound = KeyNotFound;
//# sourceMappingURL=keyNotFound.js.map