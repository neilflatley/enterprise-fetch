'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fetch = require('cross-fetch');
var promiseRetry = require('promise-retry');
var AbortController = require('abort-controller');
var to = require('await-to-js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () {
            return e[k];
          }
        });
      }
    });
  }
  n['default'] = e;
  return Object.freeze(n);
}

var fetch__default = /*#__PURE__*/_interopDefaultLegacy(fetch);
var promiseRetry__default = /*#__PURE__*/_interopDefaultLegacy(promiseRetry);
var AbortController__default = /*#__PURE__*/_interopDefaultLegacy(AbortController);
var to__default = /*#__PURE__*/_interopDefaultLegacy(to);

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
    } = await Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require('https-proxy-agent')); });
    return {
      agent: new HttpsProxyAgent(proxyUri)
    };
  }

  return {};
};

const isFunc = func => typeof func === 'function';

const isClient = () => typeof window !== 'undefined';

const thisFetch = isClient() ? window.fetch : fetch__default['default'];
const fetchWithDefaults = (fetchDefaults$1 = fetchDefaults) => {
  // Fetch function using hoisted defaults wrapped in a promise
  // retry function adhering to a default or supplied policy calling
  // a doRetry function on each failure that requires a boolean return
  const enterpriseFetch = async (url, init = {}) => {
    const fetchResponse = await promiseRetry__default['default'](async (retry, attempt) => {
      const {
        retry: retryPolicy = fetchDefaults$1.retry,
        timeout: rtimeout = fetchDefaults$1.timeout,
        doRetry = fetchDefaults$1.doRetry || fetchDefaults.doRetry,
        ...options
      } = init;
      const timeoutMs = rtimeout || fetchDefaults$1.timeout || 60 * 1000; // Abort signal pattern

      const controller = new AbortController__default['default']();
      setTimeout(() => {
        controller.abort();
      }, timeoutMs); // Try fetching, wait for error or response

      const [error, response] = await to__default['default'](thisFetch(url, { // Standard fetch options
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

exports.default = enterpriseFetch;
exports.fetchWithDefaults = fetchWithDefaults;
