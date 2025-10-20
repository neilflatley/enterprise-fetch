import fetch from 'cross-fetch';
import promiseRetry from 'promise-retry';
import AbortController from 'abort-controller';
import to from 'await-to-js';

import FetchDefaults from './fetch-defaults';
import proxyAgent from './util/server/proxy-agent';
import { isFunc } from './util/typeguards';

import { AppError, FetchInit, Fetch } from './models';
import isClient from './util/client/is-client';
export * from './models';

const thisFetch = isClient() ? window.fetch : fetch;

const fetchWithDefaults = (fetchDefaults: FetchInit = FetchDefaults) => {
  // Fetch function using hoisted defaults wrapped in a promise
  // retry function adhering to a default or supplied policy calling
  // a doRetry function on each failure that requires a boolean return
  const enterpriseFetch: Fetch = async (url, init = {}) => {
    const fetchResponse = await promiseRetry(async (retry, attempt) => {
      const {
        retry: retryPolicy = fetchDefaults.retry,
        timeout: rtimeout = fetchDefaults.timeout,
        doRetry = fetchDefaults.doRetry || FetchDefaults.doRetry,
        ...options
      } = init;
      const timeoutMs = rtimeout || fetchDefaults.timeout || 60 * 1000;

      // Abort signal pattern
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
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
        clearTimeout(timeoutId);
        if (
          isFunc(doRetry) &&
          (await doRetry(attempt, error, { url, options: init }))
        ) {
          retry(error);
        }
        throw error;
      }

      if (!response.ok) {
        clearTimeout(timeoutId);
        if (
          isFunc(doRetry) &&
          (await doRetry(attempt, response, { url, options: init }))
        ) {
          retry(response);
        }
        return response;
      }

      clearTimeout(timeoutId);
      return response;
    }, init.retry || fetchDefaults.retry);

    return fetchResponse;
  };
  return enterpriseFetch;
};

export { fetchWithDefaults };
export default fetchWithDefaults(FetchDefaults);
