import AbortController from 'abort-controller';
import { to } from 'await-to-js';
import promiseRetry from 'promise-retry';

import FetchDefaults from './fetch-defaults';
import { resolveFetch } from './util/resolve';
import proxyAgent from './util/server/proxy-agent';
import { isFunc } from './util/typeguards';

import { AppError, FetchInit, Fetch } from './models';
export * from './models';

export const fetchWithDefaults = (fetchDefaults: FetchInit = FetchDefaults) => {
  // Fetch function using hoisted defaults wrapped in a promise
  // retry function adhering to a default or supplied policy calling
  // a doRetry function on each failure that requires a boolean return
  const enterpriseFetch: Fetch = async (url, init = {}) => {
    const thisFetch = await resolveFetch();
    const fetchResponse = await promiseRetry(async (retry, attempt) => {
      const {
        retry: retryPolicy = fetchDefaults.retry,
        timeout: rtimeout = fetchDefaults.timeout,
        doRetry = fetchDefaults.doRetry || FetchDefaults.doRetry,
        ...options
      } = init;
      const timeoutMs = rtimeout || fetchDefaults.timeout || 60 * 1000;

      // Abort signal pattern
      // Since v15.4.0 Node.js comes with AbortController out of the box
      const controller =
        new AbortController() as unknown as globalThis.AbortController;
      setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      // Try fetching, wait for error or response
      const [error, response]: [AppError, Response] = await to(
        thisFetch(url, {
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
          (await doRetry(attempt, error, {
            url: url.toString(),
            options: init,
          }))
        ) {
          retry(error);
        }
        throw error;
      }

      if (!response.ok) {
        if (
          isFunc(doRetry) &&
          (await doRetry(attempt, response, {
            url: url.toString(),
            options: init,
          }))
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

export const fetch = fetchWithDefaults(FetchDefaults);
export default fetch;
