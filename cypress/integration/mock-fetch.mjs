import fetchMock from 'fetch-mock';

/**
 * Mocks a fetch request in either Cypress or a Node/Mocha environment.
 *
 * In Cypress, this uses `cy.intercept()` with a StaticResponse object.
 * If `as` is provided, it assigns an alias for `cy.wait()`.
 *
 * In Node/Mocha (with fetch-mock v12+), this uses:
 * - `.mockGlobal()` to override global fetch
 * - `.route()` to define the mock
 * - `.hardReset()` for cleanup
 *
 * @param {string|RegExp|Object} urlOrMatcher - The request matcher.
 * @param {Object} [response={}] - Static-like response object.
 * @param {number} [response.statusCode=200] - HTTP status.
 * @param {any} [response.body] - Response body.
 * @param {Object} [response.headers] - Headers.
 * @param {number} [response.delay] - Artificial response delay in ms.
 * @param {boolean} [response.forceNetworkError] - Simulate network error.
 * @param {string} [response.as] - Cypress alias name (for `cy.wait()`).
 */
export const mockFetch = (urlOrMatcher, response = {}) => {
    const isCypress = typeof globalThis.cy !== 'undefined';

    if (isCypress) {
        const {
            statusCode,
            body,
            headers,
            delay,
            forceNetworkError,
            as,
            ...rest
        } = response;

        const staticResponse = {
            ...(statusCode !== undefined && { statusCode }),
            ...(body !== undefined && { body }),
            ...(headers !== undefined && { headers }),
            ...(delay !== undefined && { delay }),
            ...(forceNetworkError && { forceNetworkError: true }),
            ...rest,
        };

        const intercept = cy.intercept(urlOrMatcher, staticResponse);
        if (as) intercept.as(as);
        return;
    }

    // Node / Mocha environment
    const {
        statusCode = 200,
        body,
        headers,
        delay,
        forceNetworkError,
    } = response;

    fetchMock.mockGlobal();

    if (forceNetworkError) {
        fetchMock.route(urlOrMatcher, { throws: new Error('forced network error') });
        return;
    }

    const mockResponse = { status: statusCode, body, headers };

    if (delay !== undefined) {
        fetchMock.route(urlOrMatcher, () =>
            new Promise((resolve) => {
                setTimeout(() => resolve(mockResponse), delay);
            })
        );
    } else {
        fetchMock.route(urlOrMatcher, mockResponse);
    }
};

/**
 * Resets fetch mocks (only needed in Node).
 */
export const resetFetchMocks = () => {
    if (typeof globalThis.cy === 'undefined') {
        fetchMock.hardReset();
    }
};
