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

      // if ('clone' in res) {
      //   const text = await res.clone().text();
      //   const body = isJson(text) ? JSON.parse(text) : text;
      //   if (body.error) {
      //     // if (body.error && body.error.code === 'DUP_RCRD') {
      //     //   return false;
      //     // }
      //   }
      // }

      // Retry request on any network error,
      // or 4xx or 5xx status codes. No retry on 404
      if (
        !res.status ||
        (res.status >= 400 && res.status !== 404) ||
        ('name' in res && res.name === 'AbortError') ||
        ('type' in res && res.type === 'aborted') ||
        ('code' in res && res.code === 'ECONNRESET') ||
        ('code' in res && res.code === 'ETIMEDOUT')
      ) {
        return true;
      }
    }
    return false;
  },
} as FetchInit;

export default fetchDefaults;
