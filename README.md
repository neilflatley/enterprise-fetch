# Enterprise Fetch [![codecov](https://codecov.io/gh/neilflatley/enterprise-fetch/branch/main/graph/badge.svg?token=48LZ3BDFHL)](https://codecov.io/gh/neilflatley/enterprise-fetch) [![Node.js CI](https://github.com/neilflatley/enterprise-fetch/actions/workflows/node.js.yml/badge.svg)](https://github.com/neilflatley/enterprise-fetch/actions/workflows/node.js.yml) ![npm](https://img.shields.io/npm/v/enterprise-fetch)

A fetch wrapper with some nice enterprise features that are missing from the default fetch implementations, such as request timeout, request proxy, and a fully configurable retry policy. Designed to work in both browser and NodeJS server environments.

ES6 module and CJS available for developers and pre-built minified bundles that can be used straight in the browser

## Simple usage

The default export provides a fetch wrapper with a default retry policy set

Use it as a drop-in replacement for your existing fetch implementation

### Examples

```javascript
import enterpriseFetch from 'enterprise-fetch';

// enterpriseFetch(url: RequestInfo, init?: FetchInit): Promise<Response>

enterpriseFetch('https://httpbin.org/json')
  .then((res) => res.json())
  .then((json) => console.log(json));

enterpriseFetch('https://httpbin.org/post', {
  method: 'post',
  body: JSON.stringify({ a: 1 }),
  headers: { 'Content-Type': 'application/json' },
})
  .then((res) => res.json())
  .then((json) => console.log(json));
```

#### Async / await

I prefer writing JavaScript in this way and would be the recommended approach where possible

```javascript
const res = await enterpriseFetch('https://httpbin.org/post', {
  method: 'post',
  body: JSON.stringify({ a: 1 }),
  headers: { 'Content-Type': 'application/json' },
});
const json = await res.json();
console.log(json);
```

### Default retry policy

```javascript
const fetchDefaults = {
  // The timeout to apply before sending Abort signal
  // to all requests that do not supply a timeout option
  timeout: 60 * 1000,
  // Retry policy for all fetch requests unless overridden
  retry: {
    retries: 3,
    minTimeout: 400,
    factor: 2,
  },
  // Do retry function to examine failures and apply custom
  // retry logic return true to retry the fetch call
  doRetry: async (attempt, res, { url, options }) => {
    // Get the retry policy from options or fetchDefaults
    const { retry = fetchDefaults.retry } = options || fetchDefaults;
    if (attempt <= retry.retries) {
      // Retry request on any network error,
      // or 4xx or 5xx status codes. No retry on 404
      if (!res.status || (res.status >= 400 && res.status !== 404)) {
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
        return true;
      }
    }
    return false;
  },
};
```

## Advanced usage

We can garnish any request `init` object with some additional options as well as the full set of `RequestInit` options supported by the standard fetch implementation

### Fetch with timeout

Uses `AbortController` signal instance to terminate the request after a specified timeout duration (in ms).

```javascript
enterpriseFetch('https://httpbin.org/json', {
  timeout: 5000,
})
  .then((res) => res.json())
  .then((json) => console.log(json));
```

### Fetch with retries

Retry the request three times, with an initial wait timeout of 1000ms with an exponential backoff factor of 500ms.

e.g. wait 1000ms after first failed request, wait 1500ms between the second and 3000ms between the third request

This is simply the options object from https://www.npmjs.com/package/promise-retry

```javascript
enterpriseFetch('https://httpbin.org/json', {
  retry: {
    retries: 3,
    minTimeout: 1000,
    factor: 500,
  },
  timeout: 5000,
})
  .then((res) => res.json())
  .then((json) => console.log(json));
```

### Fetch with retry policy and custom retry logic

Custom retry logic is required to exploit domain specific rules when deciding if another retry is required.

For example, checking the headers for existance of a specific error key, or re-setting use-once headers such as an OAuth 1.0 bearer token for the next request

```javascript
enterpriseFetch('https://httpbin.org/json', {
  retry: {
    retries: 3,
    minTimeout: 1000,
    factor: 500,
  },
  timeout: 5000,
  doRetry: async (attempt, response, { options }) => {
    const { retry } = options;
    if (attempt <= retry.retries) {
      // Retry request on any network error,
      // or any 4xx or 5xx status codes, except 404
      if (!res.status || (res.status >= 400 && res.status !== 404)) {
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
        return true;
      }
    }
    return false;
  },
})
  .then((res) => res.json())
  .then((json) => console.log(json));
```

## Application level retry policy

Create a fetch retry policy that can be used throughout your application.

Create a configuration file in your app to define fetch defaults that can be applied to all requests using this fetch wrapper.

You can then create an instance of `fetchWithDefaults(fetchDefaults)`, supplying your `fetchDefaults`. Then with this you can either redefine global fetch, or export the created instance of `fetchWithDefaults(fetchDefaults)` to import wherever it is needed in your app.

```javascript
import { fetchWithDefaults } from 'enterprise-fetch';
import { FetchInit } from 'enterprise-fetch/dist/models';

const fetchDefaults = {
  // The timeout to apply to requests that do not supply a timeout option
  timeout: 40 * 1000,
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

      Logger.warning(
        `[fetch] Attempt ${counter} ${res.status}: ${res.statusText} ${
          url || ''
        }`
      );

      if ('clone' in res) {
        const text = await res.clone().text();
        const body = isJson(text) ? JSON.parse(text) : text;
        if (body.error) {
          // if (body.error && body.error.code === 'DUP_RCRD') {
          //   return false;
          // }
        }
      }

      // Retry request on any network error, or 4xx or 5xx status codes
      if (
        (res.status >= 400 && res.status !== 404) ||
        ('type' in res && res.type === 'aborted') ||
        ('name' in res && res.name === 'AbortError') ||
        ('code' in res && res.code === 'ETIMEDOUT')
      ) {
        return true;
      }
    }
    return false;
  },
} as FetchInit;


// Redeclare fetch and apply our defaults
const fetch = fetchWithDefaults(fetchDefaults);

export default fetch;
```

## Proxying requests (NodeJS)

NodeJS only, we can leverage the `https-proxy-agent` to send our requests to a proxy server via the `agent` option in `RequestInit`, this is very useful for debugging and tracing fetch requests which is not natively possible with NodeJS.

To activate set process env variable `http_proxy` to a valid http proxy server. e.g. `process.env.http_proxy = http://127.0.0.1:8888`

## Browser bundles

Browser bundles are available for you to use if you are not using a module bundler for your application.

### Simple example

```html
<html>
  <head>
    <script
      type="text/javascript"
      src="https://unpkg.com/enterprise-fetch"
    ></script>
    <script>
      var element = function (id) {
        return document.getElementById(id);
      };
      var goFetch = function () {
        var uri = element('uri').value;
        window['enterprise-fetch'].default(uri).then(function (response) {
          alert(response.status);
        });
      };
    </script>
  </head>
  <body>
    <input type="text" id="uri" value="https://httpbin.org/status/500" />
    <input type="button" id="fetch" value="Fetch" onclick="goFetch()" />
  </body>
</html>
```

### Legacy browsers

A `cjs` bundle exists in addition to the `esm` bundle loaded by default if you require legacy browser support. The `cjs` bundle is 2x the size of the `esm` bundle due to the syntax transpilation and polyfills.

Polyfills will be required for browsers that do not have native support for

- AbortController
- fetch

You could use a polyfill service to polyfill missing features by adding a snippet like the below before loading this script
```html
<script
  type="text/javascript"
  src="https://polyfill.io/v3/polyfill.min.js?features=AbortController%2Cfetch"
></script>
```
