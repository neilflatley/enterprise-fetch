import to from 'await-to-js';
import { expect } from 'chai';
import enterpriseFetch from '../../dist/enterprise-fetch.esm';

// This is a mocha test spec except
// it can also be run in cypress
const setGlobalTimeout = (timeout = 4000) =>
  typeof Cypress !== 'undefined' &&
  Cypress.config('defaultCommandTimeout', timeout);

// Testing the tests
describe('First test', () => {
  it('Test the tests: Should assert true to be true', () => {
    expect(true).to.be.true;
  });
});

describe('Simple fetch', () => {
  let result;
  let didError = false;
  before(async () => {
    const [error, response] = await to(
      enterpriseFetch('https://httpbin.org/json')
    );
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

describe('Fetch with timeout and default retry', () => {
  let result;
  let didError = false;
  setGlobalTimeout(20 * 1000);
  before(async () => {
    const [error, response] = await to(
      enterpriseFetch('https://httbin.org/json', { timeout: 500 })
    );
    if (error) didError = true;
    result = response || error;
  });
  it('Gets aborted successfully', () => {
    expect(result.name).to.equal('AbortError');
  });
});
