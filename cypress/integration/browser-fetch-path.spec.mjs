/**
 * `resolveFetch()` hands back `window.fetch` unbound, and the library calls it as
 * `thisFetch(url, init)`. That is legal — `fetch` lives on a [Global] interface,
 * which skips the receiver brand check — but nothing in the suite says so, and a
 * future refactor that passes the function around could break it on a real
 * browser while the Node specs stayed green. Pinned here.
 */
describe('Browser fetch path', () => {
  beforeEach(() => cy.visit('/test'));

  it('uses the platform fetch, not a replacement', () => {
    cy.window().then((w) => {
      expect(w.fetch.toString()).to.contain('[native code]');
    });
  });

  it('calls window.fetch detached from its receiver', () => {
    cy.window().then((w) => {
      const detached = w.fetch;
      const url = `${Cypress.config('baseUrl')}/test/util.js`;
      cy.wrap(detached(url)).then((res) => {
        expect(res.status, 'detached fetch status').to.eq(200);
      });
    });
  });

  it('fetches through the library in the browser', () => {
    cy.intercept('https://httpbin.org/status/200', { statusCode: 200 }).as('ok');
    cy.window().then((w) => {
      const { fetchWithDefaults } = w['enterprise-fetch'];
      cy.wrap(
        fetchWithDefaults()('https://httpbin.org/status/200', {})
      ).then((res) => {
        expect(res.status, 'library fetch status').to.eq(200);
      });
    });
  });
});
