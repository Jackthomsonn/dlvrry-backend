"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotFound = void 0;
class UserNotFound extends Error {
    constructor() {
        super();
        this.status = 404;
        this.name = 'UserNotFound';
        this.message = 'User not found';
    }
}
exports.UserNotFound = UserNotFound;
//# sourceMappingURL=userNotFound.js.map