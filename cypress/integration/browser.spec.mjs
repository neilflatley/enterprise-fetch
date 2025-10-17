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
      setGlobalTimeout(10 * 1000);
      beforeEach(() => {
        fetchCount = 0;
        cy.visit('/test');
      });
      it('Fetches successfully with a default request', () => {
        cy.intercept('https://httpbin.org/status/200', {
          statusCode: 200,
        }).as('200Req');
        fetch({ response: '200' });
      });
      it('Sets a request and fetches successfully', () => {
        cy.intercept('https://httpbin.org/status/200', {
          statusCode: 200,
        }).as('200Req');
        setUrl('https://httpbin.org/status/200');
        setInit({});
        fetch({ response: '200' });
      });

      it('Sets a request with auth header in init and fetches successfully', () => {
        cy.intercept(
          {
            url: 'https://www.revitive.com/api/delivery/projects/revitiveUSA',
            headers: {
              accesstoken: '5xGSwcT2EF8WZgGmZqeqZ0dHpgXI1nAzFprZlUelD0gPiuoi',
            },
          },
          { id: 'revitiveUSA' }
        ).as('headerReq');

        setUrl('https://www.revitive.com/api/delivery/projects/revitiveUSA');
        setInit({
          headers: {
            accesstoken: '5xGSwcT2EF8WZgGmZqeqZ0dHpgXI1nAzFprZlUelD0gPiuoi',
          },
        });
        fetch({ expect: '"id": "revitiveUSA"' });

      });
      it('Then clears the auth header init and fails with a 401', () => {
        cy.intercept(
          'https://www.revitive.com/api/delivery/projects/revitiveUSA',
          (req) =>
            !req.headers['accesstoken']
              ? req.reply(401, {
                error: {
                  message: 'Authorization has been denied for this request',
                },
              })
              : req.reply()
        ).as('401Req');
        setUrl('https://www.revitive.com/api/delivery/projects/revitiveUSA');
        clearInit();
        fetch({
          response: 'Unauthorized',
          expect: 'Authorization has been denied',
        });
      });
      it(`Sets a request to a 500 url${defaults === 'App defaults' ? ' and logs \`retry: true\`' : ''}`, () => {
        cy.intercept('https://httpbin.org/status/500', {
          statusCode: 500,
        }).as('500Req');
        setUrl('https://httpbin.org/status/500');
        setInit({ ...quickRetry, timeout: 10000 });
        fetch({ response: '500', expect: 'false' });
        defaults === 'App defaults' && cy.get(`#log-${fetchCount}`).should('contain', 'retry: true');
      });
      it('Sets a request to an invalid url and times out with AbortError with retries', () => {
        cy.intercept('https://httbin.org/json', {
          delay: 1000,
          forceNetworkError: true,
        }).as('errReq');
        setUrl('https://httbin.org/json'); // invalid url
        setInit({ ...quickRetry, timeout: 100 });
        fetch({ expect: /aborted|failed/ });
      });
    }
  );
};

runBrowserTests('modern', 'App defaults');
runBrowserTests('legacy', 'App defaults');
runBrowserTests('modern', 'Built-in');
runBrowserTests('modern', 'No defaults');
runBrowserTests('modern', 'Badly set defaults');
