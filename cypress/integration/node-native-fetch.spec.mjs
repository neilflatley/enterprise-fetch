import http from 'node:http';
import { expect } from 'chai';
import enterpriseFetch from '../../instrumented/dist/enterprise-fetch.esm.js';

/**
 * Regression: the timeout signal must be the platform's own `AbortSignal`.
 *
 * `abort-controller` resolves to the native controller in the browser build but
 * to its shim on Node, and Node's global `fetch` rejects a foreign signal with
 * `RequestInit: Expected signal to be an instance of AbortSignal`. That failed
 * EVERY request on Node 18+ — not just timed-out ones — because the signal is
 * attached to every call.
 *
 * The other Node specs replace global fetch with fetch-mock, which never
 * validates the signal, so none of them could see it. This one deliberately
 * uses the real global fetch against a real server.
 *
 * Node-only: it imports `node:http`, which the Cypress webpack preprocessor
 * cannot compile. `cypress.config.ts` excludes it from the browser run; mocha
 * picks it up through the `node*.spec.mjs` glob in `mocha:run`.
 */
describe('Node native fetch compatibility', function () {
  let server;
  let origin;

  before(function (done) {
    server = http.createServer((req, res) => {
      if (req.url === '/slow') {
        return setTimeout(() => res.writeHead(200).end('late'), 5000);
      }
      res.writeHead(200).end('pong');
    });

    server.listen(0, '127.0.0.1', () => {
      origin = `http://127.0.0.1:${server.address().port}`;
      done();
    });
  });

  after(() => server && server.close());

  it('requests through the real global fetch', async () => {
    const res = await enterpriseFetch(`${origin}/ping`);
    expect(res.status).to.equal(200);
    expect(await res.text()).to.equal('pong');
  });

  it('still aborts a stalled request', async () => {
    try {
      await enterpriseFetch(`${origin}/slow`, {
        timeout: 150,
        retry: { retries: 0, minTimeout: 1, factor: 1 },
      });
      expect.fail('the stalled request should have been aborted');
    } catch (e) {
      expect(e.name, e.message).to.equal('AbortError');
    }
  });
});
