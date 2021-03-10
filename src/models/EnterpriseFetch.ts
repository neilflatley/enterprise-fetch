import { AppError } from './AppError';

export type Fetch = (url: RequestInfo, init?: FetchInit) => Promise<Response>;

export type FetchInit = RequestInit & {
  retry?: { retries: number; minTimeout: number; factor: number };
  timeout?: number;
  doRetry?: DoRetry;
};

export type DoRetry = (
  attempt: number,
  response: AppError | Response,
  fetchArgs?: {
    url: RequestInfo;
    options?: FetchInit;
  }
) => Promise<boolean>;
