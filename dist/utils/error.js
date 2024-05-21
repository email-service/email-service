"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorManagement = void 0;
function errorManagement(error) {
    console.warn('Error occurred', error);
    if (error instanceof Error)
        return { status: 500, name: error.name, message: error.message };
    else
        return { status: 500, name: 'UNKNOW', message: 'Unknow error' };
}
exports.errorManagement = errorManagement;
