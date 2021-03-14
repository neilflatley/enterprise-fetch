import fetch from 'cross-fetch';
import promiseRetry from 'promise-retry';
import AbortController from 'abort-controller';
import to from 'await-to-js';

const fetchDefaults = {
  // The timeout to apply to requests that do not supply a timeout option
  timeout: 60 * 1000,
  // Retry policy for all fetch requests
  retry: {
    retries: 3,
    minTimeout: 400,
    factor: 2
  },
  // Do retry function to examine failures and apply custom retry logic
  // return true to retry the fetch call
  doRetry: async (attempt, res, {
    url,
    options
  }) => {
    // Get the retry policy from options or fetchDefaults
    const {
      retry = fetchDefaults.retry
    } = options;

    if (attempt <= retry.retries) {
      const counter = `${attempt}/${retry.retries}`;
      if ('message' in res) console.warn(`[fetch] Attempt ${counter} ${res.name}: ${res.message} ${url}`);else console.warn(`[fetch] Attempt ${counter} ${res.status}: ${res.statusText} ${url}`); // Retry request on any network error,
      // or 4xx or 5xx status codes. No retry on 404

      if (!res.status || res.status >= 400 && res.status !== 404) {
        return true;
      }
    }

    return false;
  }
};

// Setting http_proxy in env will inject a proxy agent header and disable certificate verification
const proxyAgent = async () => {
  const proxyUri = typeof process !== 'undefined' && process.env.http_proxy || false;

  if (proxyUri) {
    console.info(`Proxying via http_proxy: ${process.env.http_proxy}`);
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const {
      HttpsProxyAgent
    } = await import('https-proxy-agent');
    return {
      agent: new HttpsProxyAgent(proxyUri)
    };
  }

  return {};
};

const isFunc = func => typeof func === 'function';

const isClient = () => typeof window !== 'undefined';

const thisFetch = isClient() ? window.fetch : fetch;
const fetchWithDefaults = (fetchDefaults$1 = fetchDefaults) => {
  // Fetch function using hoisted defaults wrapped in a promise
  // retry function adhering to a default or supplied policy calling
  // a doRetry function on each failure that requires a boolean return
  const enterpriseFetch = async (url, init = {}) => {
    const fetchResponse = await promiseRetry(async (retry, attempt) => {
      const {
        retry: retryPolicy = fetchDefaults$1.retry,
        timeout: rtimeout = fetchDefaults$1.timeout,
        doRetry = fetchDefaults$1.doRetry || fetchDefaults.doRetry,
        ...options
      } = init;
      const timeoutMs = rtimeout || fetchDefaults$1.timeout || 60 * 1000; // Abort signal pattern

      const controller = new AbortController();
      setTimeout(() => {
        controller.abort();
      }, timeoutMs); // Try fetching, wait for error or response

      const [error, response] = await to(thisFetch(url, { // Standard fetch options
        ...options,
        // Conditionally add a proxy agent to debug requests
        ...(await proxyAgent()),
        // The signal will recieve abort() after timeout elapsed
        signal: controller.signal
      }));

      if (error) {
        if (isFunc(doRetry) && (await doRetry(attempt, error, {
          url,
          options: init
        }))) {
          retry(error);
        }

        throw error;
      }

      if (!response.ok) {
        if (isFunc(doRetry) && (await doRetry(attempt, response, {
          url,
          options: init
        }))) {
          retry(response);
        }

        return response;
      }

      return response;
    }, init.retry || fetchDefaults$1.retry);
    return fetchResponse;
  };

  return enterpriseFetch;
};
var enterpriseFetch = fetchWithDefaults(fetchDefaults);

export default enterpriseFetch;
export { fetchWithDefaults };
