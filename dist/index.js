"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailDispatcher = exports.helloWorld = void 0;
console.log('app started');
// src/index.ts
function helloWorld(name) {
    return `Hello modifé, ${name}!`;
}
exports.helloWorld = helloWorld;
const emailDispatcher_1 = require("./models/emailDispatcher");
Object.defineProperty(exports, "EmailDispatcher", { enumerable: true, get: function () { return emailDispatcher_1.EmailDispatcher; } });
