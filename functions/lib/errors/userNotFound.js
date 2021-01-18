"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotFound = void 0;
class UserNotFound extends Error {
    constructor() {
        super();
        this.name = 'UserNotFound';
        this.message = 'User Not Found';
    }
}
exports.UserNotFound = UserNotFound;
//# sourceMappingURL=userNotFound.js.map