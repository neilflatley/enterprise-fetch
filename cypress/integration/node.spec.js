import to from 'await-to-js';
import { expect } from 'chai';
import enterpriseFetch, {
  fetchWithDefaults,
} from '../../dist/instrumented/enterprise-fetch.esm';

// This is a mocha test spec except
// it can also be run in cypress
const setGlobalTimeout = (timeout = 4000) =>
  typeof Cypress !== 'undefined' &&
  Cypress.config('defaultCommandTimeout', timeout);

const runNodeTests = (fetchFn, defaults) => {
  describe('Simple fetch [env: node] [defaults: ' + defaults + ']', () => {
    let result;
    let didError = false;
    before(async () => {
      const [error, response] = await to(fetchFn('https://httpbin.org/json'));
      if (error) didError = true;
      result = response || error;
    });
    it('Gets a 200 successfully', () => {
      expect(result.status).to.equal(200);
    });
    it('Did not error', () => {
      expect(result.name || result.message).to.not.exist;
      expect(didError).to.equal(false);
      if (didError) console.error(result);
    });
    it('Parses the json in the response', async () => {
      const json = await result.json();
      expect(json).does.exist;
    });
  });

  describe(
    'Fetch with error and retry [env: node] [defaults: ' + defaults + ']',
    () => {
      let result;
      let didError = false;
      setGlobalTimeout(20 * 1000);
      before(async () => {
        const [error, response] = await to(
          fetchFn('https://httpbin.org/status/500', {
            retry: { retries: 1 },
            timeout: 10000,
          })
        );
        if (error) didError = true;
        result = response || error;
      });
      it('Retries before returning the 500 status', () => {
        expect(result.status).to.equal(500);
      });
    }
  );

  describe(
    'Fetch with timeout and default retry [env: node] [defaults: ' +
      defaults +
      ']',
    () => {
      let result;
      let didError = false;
      setGlobalTimeout(20 * 1000);
      before(async () => {
        const [error, response] = await to(
          fetchFn('https://httbin.org/json', {
            timeout: 100,
          })
        );
        if (error) didError = true;
        result = response || error;
      });
      it('Gets aborted successfully', () => {
        expect(result.name).to.equal('AbortError');
      });
    }
  );

  typeof cy !== 'undefined' &&
    describe(
      'Fetch with proxy [env: node] [defaults: ' + defaults + ']',
      () => {
        let response, error;
        before(async () => {
          process.env.http_proxy = 'http://127.0.0.1:8888';
          cy.intercept('http://127.0.0.1:8888', {
            statusCode: 422,
            body: JSON.stringify({ json: 'it worked!' }),
          }).as('proxyReq');
          [error, response] = await to(
            fetchFn('https://httpbin.org/status/422')
          );
        });
        it('Gets a 422 successfully', () => {
          expect(response.status).to.equal(422);
        });
        it('Did not error', () => {
          expect(error).to.not.exist;
          if (error) console.error(result);
          process.env.http_proxy = undefined;
        });
        // it('Parses the json in the response', async () => {
        //   const json = await response.json();
        //   expect(json).does.exist;
        // });
      }
    );

  typeof cy !== 'undefined' &&
    describe(
      'Fetch 404 (non-retriable) [env: node] [defaults: ' + defaults + ']',
      () => {
        let response, error;
        before(async () => {
          cy.intercept('https://httpbin.org/status/404', {
            statusCode: 404,
          }).as('proxyReq');
          [error, response] = await to(
            fetchFn('https://httpbin.org/status/404')
          );
        });
        it('Gets a 404 successfully', () => {
          expect(response.status).to.equal(404);
        });
        it('Did not error', () => {
          expect(error).to.not.exist;
          if (error) console.error(result);
        });
        // it('Parses the json in the response', async () => {
        //   const json = await response.json();
        //   expect(json).does.exist;
        // });
      }
    );
};

runNodeTests(enterpriseFetch, 'built-in');
runNodeTests(fetchWithDefaults(), 'none');
runNodeTests(fetchWithDefaults({}), 'badly-set');
