import { FetchInit } from './models/EnterpriseFetch';

const fetchDefaults = {
  // The timeout to apply to requests that do not supply a timeout option
  timeout: 60 * 1000,
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
    const { retry = fetchDefaults.retry } = options;
    if (attempt <= retry.retries) {
      const counter = `${attempt}/${retry.retries}`;

      if ('message' in res)
        console.warn(
          `[fetch] Attempt ${counter} ${res.name}: ${res.message} ${url}`
        );
      else
        console.warn(
          `[fetch] Attempt ${counter} ${res.status}: ${res.statusText} ${url}`
        );

      // Retry request on any network error,
      // or 4xx or 5xx status codes. No retry on 404
      if (!res.status || (res.status >= 400 && res.status !== 404)) {
        return true;
      }
    }
    return false;
  },
} as FetchInit;

export default fetchDefaults;
