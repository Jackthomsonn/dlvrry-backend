"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobTaken = void 0;
class JobTaken extends Error {
    constructor() {
        super();
        this.status = 400;
        this.name = 'JobTaken';
        this.message = 'This job has been taken';
    }
}
exports.JobTaken = JobTaken;
//# sourceMappingURL=jobTaken.js.map