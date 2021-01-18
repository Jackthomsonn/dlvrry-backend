"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCors = void 0;
exports.handleCors = (response) => {
    response.set('Access-Control-Allow-Methods', 'POST');
    response.set('Access-Control-Max-Age', '3600');
    response.status(204).send('');
};
//# sourceMappingURL=cors.js.map