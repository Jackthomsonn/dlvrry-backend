"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = void 0;
class Response {
    static success(data = {}) {
        return data;
    }
    static fail(error) {
        return {
            status: error.status ? error.status : 500,
            message: error.message ? error.message : 'Internal Server Error',
        };
    }
}
exports.Response = Response;
//# sourceMappingURL=index.js.map