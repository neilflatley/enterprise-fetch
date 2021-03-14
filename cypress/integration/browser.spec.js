let fetchCount = 0,
  requestCount = 0;

const acceptObject = (obj) =>
  typeof obj === 'object' ? JSON.stringify(obj) : obj;

const quickRetry = { retry: { retries: 2, minTimeout: 100 } };
const quickTimeoutRetry = { ...quickRetry, timeout: 500 };

const setGlobalTimeout = (timeout = 4000) =>
  typeof Cypress !== 'undefined' &&
  Cypress.config('defaultCommandTimeout', timeout);

const clearUrl = () => cy.get('#url').clear();
const setUrl = (url) => clearUrl().type(url).should('have.value', url);

const clearInit = () => cy.get('#init').clear();
const setInit = (init) =>
  clearInit().type(acceptObject(init), { parseSpecialCharSequences: false });

const runBrowserTests = (bundle, defaults) => {
  const fetch = ({ expect, response }) => {
    ++fetchCount;
    cy.get('#defaults').select(defaults);
    cy.get('#goFetch' + (bundle === 'legacy' ? 'Legacy' : '')).click();
    if (response) cy.get(`#log-${fetchCount}`).should('contain', response);
    if (expect) cy.get(`#response-${fetchCount}`).should('contain', expect);
  };
  describe(
    'Browser tests [bundle: ' + bundle + '] [defaults: ' + defaults + ']',
    () => {
      setGlobalTimeout(20 * 1000);
      before(() => {
        cy.visit('/test');
        fetchCount = 0;
      });
      it('Fetches successfully with a default request', () => {
        fetch({ response: '200' });
      });
      it('Sets a request and fetches successfully', () => {
        setUrl('https://httpbin.org/status/200');
        setInit({});
        fetch({ response: '200' });
      });
      it('Sets a request and an init and fetches successfully', () => {
        setUrl('https://www.revitive.com/api/delivery/projects/revitiveUSA');
        setInit({
          headers: {
            accesstoken: '5xGSwcT2EF8WZgGmZqeqZ0dHpgXI1nAzFprZlUelD0gPiuoi',
          },
        });
        fetch({ expect: '"id": "revitiveUSA"' });
      });
      it('Then clears the init and fails with a 401', () => {
        clearInit();
        fetch({
          response: 'Unauthorized',
          expect: 'Authorization has been denied',
        });
      });
      it('Sets a request to a 500 url', () => {
        setUrl('https://httpbin.org/status/500');
        setInit({ ...quickRetry, timeout: 10000 });
        fetch({ response: '500', expect: 'false' });
      });
      defaults === 'app' &&
        it('Checks the log for retry: true', () => {
          cy.get(`#log-${fetchCount}`).should('contain', 'retry: true');
        });
      it('Sets a request to an invalid url and times out with AbortError with retries', () => {
        setUrl('https://httbin.org/json'); // invalid url
        setInit({ ...quickRetry, timeout: 100 });
        fetch({ expect: 'The operation was aborted.' });
      });
    }
  );
};

runBrowserTests('modern', 'app');
runBrowserTests('legacy', 'app');
runBrowserTests('modern', 'built-in');
runBrowserTests('modern', 'none');
runBrowserTests('modern', 'badly-set');
