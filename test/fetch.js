var telemetry = {
  fetchRequests: 0,
  requests: 0,
};

var logFetch = function () {
  element('requests').textContent = ++telemetry.fetchRequests;
  logRequest();
};

var logRequest = function () {
  element('total-requests').textContent = ++telemetry.requests;
};

var fetchDefaults = {
  timeout: 60 * 1000,
  retry: {
    retries: 1,
    minTimeout: 1000,
    factor: 2,
  },
  doRetry: function (attempt, res, { url, options }) {
    // Get the retry policy from options or fetchDefaults
    const { retry = fetchDefaults.retry } = options || fetchDefaults;
    let retriable = false;
    if (attempt <= retry.retries) {
      const counter = `${attempt}/${retry.retries}`;
      let logMsg;

      if ('message' in res)
        logMsg = `[fetch] Attempt ${counter} ${
          res.name || ('type' in res && res.type)
        }: ${res.message} ${url || ''}`;
      else
        logMsg = `[fetch] Attempt ${counter} ${res.status}: ${res.statusText} ${
          url || ''
        }`;

      // Retry request on any network error,
      // or 4xx or 5xx status codes. No retry on 404
      if (!res.status || (res.status >= 400 && res.status !== 404)) {
        logRequest();
        retriable = true;
      }
      appendLog(logMsg + ' - retry: ' + retriable, telemetry.fetchRequests);
      console.warn(logMsg);
    }
    return retriable;
  },
};

var defaultRequest = {
  url: 'https://httpbin.org/json',
  init: {
    retry: { retries: 2, minTimeout: 1000, factor: 2 },
    headers: {
      accesstoken: '5xGSwcT2EF8WZgGmZqeqZ0dHpgXI1nAzFprZlUelD0gPiuoi',
    },
  },
};

var getFetchInstance = function (defaults) {
  switch (defaults) {
    case 'built-in':
      return enterpriseFetch;
    case 'app':
      return enterpriseFetchWithDefaults;
    case 'none':
      return enterpriseFetchWithNoDefaults;
    case 'badly-set':
      return enterpriseFetchWithBadDefaults;
  }
};

var goFetch = function (isLegacy = false) {
  if (isLegacy) {
    enterpriseFetch = enterpriseFetchLegacy;
    enterpriseFetchWithDefaults = enterpriseFetchLegacyWithDefaults;
    enterpriseFetchWithBadDefaults = enterpriseFetchLegacyWithBadDefaults;
    enterpriseFetchWithNoDefaults = enterpriseFetchLegacyWithNoDefaults;
  } else {
    enterpriseFetch = enterpriseFetchModern;
    enterpriseFetchWithDefaults = enterpriseFetchModernWithDefaults;
    enterpriseFetchWithBadDefaults = enterpriseFetchModernWithBadDefaults;
    enterpriseFetchWithNoDefaults = enterpriseFetchModernWithNoDefaults;
  }

  var url = element('url').value;
  var obj = eval('(' + (element('init').value || 'false') + ')');
  logFetch();
  // To ensure full test coverage we need to use all combinations of fetch
  const fetchFn = getFetchInstance(element('defaults').value);
  var init = obj || undefined;
  fetchFn(url, init)
    .then(function (res) {
      appendLog(
        'status: ' + res.status + ' ' + res.statusText,
        telemetry.fetchRequests
      );
      return res.text();
    })
    .then(function (text) {
      addResponse(tryParse(text), telemetry.fetchRequests);
    })
    .catch(function (ex) {
      addResponse(ex.toString(), telemetry.fetchRequests);
    });
};

// To ensure full test coverage we need to use all combinations of fetch
var enterpriseFetch,
  enterpriseFetchWithDefaults,
  enterpriseFetchWithBadDefaults,
  enterpriseFetchWithNoDefaults;
var enterpriseFetchModern,
  enterpriseFetchModernWithDefaults,
  enterpriseFetchModernWithBadDefaults,
  enterpriseFetchModernWithNoDefaults;
var enterpriseFetchLegacy,
  enterpriseFetchLegacyWithDefaults,
  enterpriseFetchLegacyWithBadDefaults,
  enterpriseFetchLegacyWithNoDefaults;

var onFetchLoaded = function () {
  element('url').value = defaultRequest.url;
  // var init = JSON.stringify(defaultRequest.init, null, 2);
  // element('init').value = init;

  // Autosize anything in the DOM on page load
  Array.from(document.querySelectorAll('textarea[autosize]')).forEach(autosize);

  // Setup observer to autosize anything after page load
  new MutationObserver(function (mutations) {
    Array.from(mutations).forEach(function (mutation) {
      Array.from(mutation.addedNodes).forEach(function (node) {
        if (node.matches('textarea[autosize]')) {
          autosize(node);
        }
      });
    });
  }).observe(document.body, { childList: true });
};

var onEnterpriseFetchLoaded = function () {
  // To ensure full test coverage we need to use all combinations of fetch
  var efetch = window['enterprise-fetch'];
  enterpriseFetchModern = efetch.default;
  enterpriseFetchModernWithDefaults = efetch.fetchWithDefaults(fetchDefaults);
  enterpriseFetchModernWithNoDefaults = efetch.fetchWithDefaults();
  enterpriseFetchModernWithBadDefaults = efetch.fetchWithDefaults({});
  element('url').focus();
};

var onEnterpriseFetchLegacyLoaded = function () {
  // To ensure full test coverage we need to use all combinations of fetch
  var efetchLegacy = window['enterprise-fetch-legacy'];
  enterpriseFetchLegacy = efetchLegacy.default;
  enterpriseFetchLegacyWithDefaults = efetchLegacy.fetchWithDefaults(
    fetchDefaults
  );
  enterpriseFetchLegacyWithNoDefaults = efetchLegacy.fetchWithDefaults();
  enterpriseFetchLegacyWithBadDefaults = efetchLegacy.fetchWithDefaults({});
  element('url').focus();
};
