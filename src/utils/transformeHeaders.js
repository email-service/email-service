"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformHeaders = transformHeaders;
function transformHeaders(headers) {
    return headers.reduce(function (acc, header) {
        acc[header.name] = header.value;
        return acc;
    }, {});
}
