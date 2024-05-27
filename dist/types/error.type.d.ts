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
