let fetchCount = 0,
  requestCount = 0;

const acceptObject = (obj) =>
  typeof obj === 'object' ? JSON.stringify(obj) : obj;

const clearUrl = () => cy.get('#url').clear();
const setUrl = (url) => clearUrl(url).type(url).should('have.value', url);

const clearInit = () => cy.get('#init').clear();
const setInit = (init) =>
  clearInit(init)
    .type(acceptObject(init), { parseSpecialCharSequences: false })
    .should('have.value', acceptObject(init));

const fetch = ({ expect, response }) => {
  ++fetchCount;
  cy.get('#goFetch').click();
  if (response) cy.get(`#log-${fetchCount}`).should('contain', response);
  if (expect) cy.get(`#response-${fetchCount}`).should('contain', expect);
};

describe('Browser tests via Test page', () => {
  it('Visits the Test page', () => {
    cy.visit('/test');

    fetch({ response: '200' });

    setUrl('https://httpbin.org/status/200');
    fetch({ response: '200' });

    setUrl('https://www.revitive.com/api/delivery/projects/revitiveUSA');
    setInit({
      headers: {
        accesstoken: '5xGSwcT2EF8WZgGmZqeqZ0dHpgXI1nAzFprZlUelD0gPiuoi',
      },
    });
    fetch({ expect: '"id": "revitiveUSA"' });

    clearInit();
    fetch({ response: '401', expect: 'Authorization has been denied' });
    cy.get(`#log-${fetchCount}`).should('contain', 'retry: true');
  });
});
