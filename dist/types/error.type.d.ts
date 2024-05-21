export type StandardError = {
    status: number;
    name: string;
    message: string;
    cause?: string;
    stack?: string;
};
