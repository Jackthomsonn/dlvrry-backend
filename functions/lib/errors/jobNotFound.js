"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobNotFound = void 0;
class JobNotFound extends Error {
    constructor() {
        super();
        this.status = 404;
        this.name = 'JobNotFound';
        this.message = 'Job not found';
    }
}
exports.JobNotFound = JobNotFound;
//# sourceMappingURL=jobNotFound.js.map