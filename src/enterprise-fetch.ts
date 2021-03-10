import fetch from 'cross-fetch';
import promiseRetry from 'promise-retry';
import AbortController from 'abort-controller';
import to from 'await-to-js';

import proxyAgent from './util/server/proxy-agent';
import { isFunc } from './util/typeguards';
import FetchDefaults from './fetch-defaults';

import { AppError, FetchInit, Fetch } from './models';
export * from './models';

export const fetchWithDefaults = (fetchDefaults: FetchInit) => {
  const myfetch = fetch;
  // Fetch function using hoisted defaults wrapped in a promise
  // retry function adhering to a default or supplied policy calling
  // a doRetry function on each failure that requires a boolean return
  const enterpriseFetch: Fetch = async (url, init) => {
    const fetchResponse = await promiseRetry(async (retry, attempt) => {
      const {
        retry: retryPolicy = fetchDefaults.retry,
        timeout: rtimeout = fetchDefaults.timeout,
        doRetry = fetchDefaults.doRetry,
        ...options
      } = init;
      const timeoutMs = rtimeout || fetchDefaults.timeout || 50 * 1000;

      // Abort signal pattern
      const controller = new AbortController();
      setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      // Try fetching, wait for error or response
      const [error, response]: [AppError, Response] = await to(
        myfetch(url, {
          // Standard fetch options
          ...options,
          // Conditionally add a proxy agent to debug requests
          ...(await proxyAgent()),
          // The signal will recieve abort() after timeout elapsed
          signal: controller.signal,
        })
      );
      if (error) {
        if (
          isFunc(doRetry) &&
          (await doRetry(attempt, error, { url, options: init }))
        ) {
          retry(error);
        }
        throw error;
      }

      if (!response.ok) {
        if (
          isFunc(doRetry) &&
          (await doRetry(attempt, response, { url, options: init }))
        ) {
          retry(response);
        }
        return response;
      }

      return response;
    }, init.retry || fetchDefaults.retry);

    return fetchResponse;
  };
  return enterpriseFetch;
};

export default fetchWithDefaults(FetchDefaults);
