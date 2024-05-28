export type ErrorType = {
    ok: true;
    status: number;
    data: any;
    meta?: any;
} | {
    ok: false;
    status: number;
    error: StandardError;
};
export type StandardError = {
    name: string;
    message: string;
    cause?: string | object;
    stack?: string;
};
export type ESPStandardizedError = {
    name: string;
    cause?: string | object;
    stack?: string;
    category: Category;
};
type Category = 'Authentification' | 'Service' | 'Validation' | 'SenderSignature' | 'Domain' | 'Account' | 'Server' | 'Message' | 'Trigger' | 'InboundRule' | 'Stats' | 'Bounce' | 'Template' | 'MessageStream' | 'DataRemoval' | 'Campaign' | 'Document' | 'Permission' | 'Account' | 'server';
export {};
