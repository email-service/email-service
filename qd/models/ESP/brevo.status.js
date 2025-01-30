"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webHookStatus = void 0;
exports.webHookStatus = {
    request: 'SENDED',
    delivered: 'DELIVERED',
    soft_bounce: 'SOFT_BOUNCE',
    hard_bounce: 'HARD_BOUNCE',
    complaint: 'SPAM_COMPLAINT',
    click: 'CLICKED',
    defered: 'DELAYED',
    unique_opened: 'CLICKED',
    opened: 'OPENED',
    invalid_email: 'HARD_BOUNCE',
    blocked: 'REJECTED',
    error: 'REJECTED',
    unsubscribe: 'SUBSCRIPTION_CHANGE',
    proxy_open: 'REJECTED'
};
