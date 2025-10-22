import { to } from 'await-to-js';
import { expect } from 'chai';
import { mockFetch } from './mock-fetch.mjs';
import enterpriseFetch, {
  fetchWithDefaults,
} from '../../instrumented/dist/enterprise-fetch.esm.js';

// This is a mocha test spec except
// it can also be run in cypress
const setGlobalTimeout = (timeout = 4000) =>
  typeof Cypress !== 'undefined' &&
  Cypress.config('defaultCommandTimeout', timeout);

const runNodeTests = (fetchFn, defaults) => {
  describe.only('Node module tests [env: node] [defaults: ' + defaults + ']', () => {
    setGlobalTimeout(20 * 1000);
    let response, error;

    it('Gets a 200 successfully and parses response JSON', async () => {
      mockFetch('https://httpbun.com/get', {
        statusCode: 200,
        body: { // random data from httpbun
          "method": "GET",
          "headers": {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-GB,en;q=0.9,en-US;q=0.8",
            "Host": "httpbun.com",
          },
        }
      });
      [error, response] = await to(fetchFn('https://httpbun.com/get'));
      expect(response?.status).to.equal(200);
      const json = await response.json();
      expect(json).does.exist;
    });

    it('Fetch with timeout and default retry', async () => {
      mockFetch('https://httpbun.com/mix/s=500', {
        statusCode: 500,
        delay: 50
      });
      [error, response] = await to(
        fetchFn('https://httpbun.com/mix/s=500', {
          retry: { retries: 1 },
          timeout: 10000,
        })
      );
      expect(response?.status).to.equal(500);
    });

    it('Gets aborted successfully', async () => {
      mockFetch('https://httpbun.com/getx', {
        statusCode: 200,
        delay: 2000
      });
      [error, response] = await to(
        fetchFn('https://httpbun.com/getx', {
          timeout: 100,
        })
      );
      if (error) console.error(error);
      console.log(response);
      expect((error || response).name).to.equal('AbortError');
    });

    it('Gets a 404 successfully (non-retriable)', async () => {
      mockFetch('https://httpbun.com/mix/s=404', {
        statusCode: 404,
      });
      [error, response] = await to(fetchFn('https://httpbun.com/mix/s=404'));
      if (error) console.error(error);
      expect(error).to.not.exist;
      expect(response?.status).to.equal(404);
    });

    // This test isn't working as Cypress bundles the script with Webpack 5 to run in a headless browser
    // The proxy agent is added to the fetch request, but is not picked up by node-fetch, instead window.fetch is used
    // It does however ensure test coverage of the proxyAgent code path
    it('Fetch with proxy server via http_proxy', async () => {
      // mockFetch('http://127.0.0.1:8888', {
      //   statusCode: 422,
      //   // body: JSON.stringify({ json: 'it worked!' }),
      // });
      process.env.http_proxy = 'http://127.0.0.1:8888';
      mockFetch('https://httpbun.com/mix/s=422', {
        statusCode: 422,
      });
      [error, response] = await to(fetchFn('https://httpbun.com/mix/s=422'));
      delete process.env.http_proxy;
      if (error) console.error(error);
      expect(error).to.not.exist;
      expect(response?.status).to.equal(422);
    });
  });
};


runNodeTests(enterpriseFetch, 'built-in');
runNodeTests(fetchWithDefaults(), 'none');
runNodeTests(fetchWithDefaults({}), 'badly-set');
// globalThis.fallbackFetch = true;
// runNodeTests(enterpriseFetch, 'built-in (node-fetch fallback)');
