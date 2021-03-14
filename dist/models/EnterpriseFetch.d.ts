import { AppError } from './AppError';
export declare type Fetch = (url: RequestInfo, init?: FetchInit) => Promise<Response>;
export declare type FetchInit = RequestInit & {
    retry?: {
        retries: number;
        minTimeout: number;
        factor: number;
    };
    timeout?: number;
    doRetry?: DoRetry;
};
export declare type DoRetry = (attempt: number, response: AppError | Response, fetchArgs?: {
    url: RequestInfo;
    options?: FetchInit;
}) => Promise<boolean>;
