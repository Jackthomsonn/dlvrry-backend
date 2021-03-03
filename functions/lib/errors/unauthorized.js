"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unauthorized = void 0;
class Unauthorized extends Error {
    constructor() {
        super();
        this.status = 401;
        this.name = 'Unauthorized';
        this.message = 'You are not authorized to perform this action';
    }
}
exports.Unauthorized = Unauthorized;
//# sourceMappingURL=unauthorized.js.map