import to from 'await-to-js';
import { expect } from 'chai';
import enterpriseFetch, {
  fetchWithDefaults,
} from '../../instrumented/dist/enterprise-fetch.esm';

// This is a mocha test spec except
// it can also be run in cypress
const setGlobalTimeout = (timeout = 4000) =>
  typeof Cypress !== 'undefined' &&
  Cypress.config('defaultCommandTimeout', timeout);

const runNodeTests = (fetchFn, defaults) => {
  describe('Node module tests [env: node] [defaults: ' + defaults + ']', () => {
    let response, error;
    it('Gets a 200 successfully', async () => {
      [error, response] = await to(fetchFn('https://httpbin.org/json'));
      expect(response.status).to.equal(200);
    });
    it('Parses the json in the response', async () => {
      const json = await response.json();
      expect(json).does.exist;
    });
    it('Fetch with timeout and default retry', async () => {
      setGlobalTimeout(20 * 1000);
      [error, response] = await to(
        fetchFn('https://httpbin.org/status/500', {
          retry: { retries: 1 },
          timeout: 10000,
        })
      );
      expect(response.status).to.equal(500);
    });
    it('Gets aborted successfully', async () => {
      [error, response] = await to(
        fetchFn('https://httbin.org/json', {
          timeout: 100,
        })
      );
      expect((error || response).name).to.equal('AbortError');
    });

    it('Gets a 404 successfully (non-retriable)', async () => {
      cy.intercept('https://httpbin.org/status/404', {
        statusCode: 404,
      }).as('proxyReq');
      [error, response] = await to(fetchFn('https://httpbin.org/status/404'));
      expect(response.status).to.equal(404);
    });
    it('Did not error', () => {
      expect(error).to.not.exist;
      if (error) console.error(result);
    });
    it('Fetch with proxy server via http_proxy', async () => {
      process.env.http_proxy = 'http://127.0.0.1:8888';
      cy.intercept('http://127.0.0.1:8888', {
        statusCode: 422,
        body: JSON.stringify({ json: 'it worked!' }),
      }).as('proxyReq');
      [error, response] = await to(fetchFn('https://httpbin.org/status/422'));
      expect(response.status).to.equal(422);
    });
    it('Did not error', () => {
      expect(error).to.not.exist;
      if (error) console.error(result);
      process.env.http_proxy = undefined;
    });
  });
};

runNodeTests(enterpriseFetch, 'built-in');
runNodeTests(fetchWithDefaults(), 'none');
runNodeTests(fetchWithDefaults({}), 'badly-set');
