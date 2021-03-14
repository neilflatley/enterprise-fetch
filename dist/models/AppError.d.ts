export declare type AppError = (Error & ApiErrorResponse) | ApiErrorResponse;
declare type InnerDataArray = [
    {
        field: string;
        message: string;
    }
];
export declare type ApiErrorResponse = {
    name?: string;
    error?: {
        code: string;
        message: string;
    };
    code?: string;
    type?: string;
    timeout?: number;
    status?: number;
    statusText?: string;
    url?: string;
    data?: {
        logId: string;
        message: string;
        data: InnerDataArray;
        type: string;
    } | any;
};
export {};
