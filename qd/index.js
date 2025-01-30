"use strict";
// src/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailServiceSelector = exports.getWebHook = exports.getEmailService = void 0;
const emailServiceSelector_1 = require("./models/emailServiceSelector");
Object.defineProperty(exports, "getEmailService", { enumerable: true, get: function () { return emailServiceSelector_1.getEmailService; } });
Object.defineProperty(exports, "getWebHook", { enumerable: true, get: function () { return emailServiceSelector_1.getWebHook; } });
Object.defineProperty(exports, "EmailServiceSelector", { enumerable: true, get: function () { return emailServiceSelector_1.EmailServiceSelector; } });
