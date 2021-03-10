import promiseRetry from 'promise-retry';
import AbortController from 'abort-controller';
import { to } from 'await-to-js';

const fetchDefaults = {
  // The timeout to apply to requests that do not supply a timeout option
  timeout: 8 * 1000,
  // Retry policy for all fetch requests
  retry: {
    retries: 3,
    minTimeout: 400,
    factor: 2,
  },
  // Do retry function to examine failures and apply custom retry logic
  // return true to retry the fetch call
  doRetry: async (attempt, res, { url, options }) => {
    // Get the retry policy from options or fetchDefaults
    const { retry = fetchDefaults.retry } = options || fetchDefaults;
    if (attempt <= retry.retries) {
      const counter = `${attempt}/${retry.retries}`;

      if ('message' in res)
        console.warn(
          `[fetch] Attempt ${counter} ${
            res.name || ('type' in res && res.type)
          }: ${res.message} ${url || ''}`
        );
      else
        console.warn(
          `[fetch] Attempt ${counter} ${res.status}: ${res.statusText} ${
            url || ''
          }`
        );

      // Retry request on any network error, or 4xx or 5xx status codes
      if (
        (res.status >= 400 && res.status !== 404) ||
        ('name' in res && res.name === 'AbortError') ||
        ('type' in res && res.type === 'aborted') ||
        ('code' in res && res.code === 'ETIMEDOUT')
      ) {
        return true;
      }
    }
    return false;
  },
};

const isFunc = (func) => typeof func === 'function';

export const fetchWithDefaults = (defaults) => {
  // Fetch function using hoisted defaults wrapped in a promise
  // retry function adhering to a default or supplied policy calling
  // a doRetry function on each failure that requires a boolean return
  const newFetch = async (url, init) => {
    const {
      retry: retryPolicy = defaults.retry,
      timeout: rtimeout = defaults.timeout,
      doRetry = defaults.doRetry,
      ...options
    } = init;
    const timeoutMs = rtimeout || defaults.timeout || 50 * 1000;
    const fetchResponse = await promiseRetry(async (retry, attempt) => {
      // Abort signal pattern
      const controller = new AbortController();
      setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      // Try fetching, wait for error or response
      const [error, response] = await to(
        fetch(url, {
          // Standard fetch options
          ...options,
          // // Conditionally add a proxy agent to debug requests
          // ...proxyAgent(),
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
    }, retryPolicy);

    return fetchResponse;
  };
  return newFetch;
};

export default fetchWithDefaults(fetchDefaults);
