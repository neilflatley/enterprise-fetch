var telemetry = {
  fetchRequests: 0,
  requests: 0,
};

var logFetch = () => {
  document.getElementById('requests').textContent = ++telemetry.fetchRequests;
  logRequest();
};

var logRequest = () => {
  document.getElementById('total-requests').textContent = ++telemetry.requests;
};

var fetchDefaults = {
  timeout: 60 * 1000,
  doRetry: async (attempt, res, { url, options }) => {
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
      if (
        !res.status ||
        (res.status >= 400 && res.status !== 404) ||
        ('name' in res && res.name === 'AbortError') ||
        ('type' in res && res.type === 'aborted') ||
        ('code' in res && res.code === 'ECONNRESET') ||
        ('code' in res && res.code === 'ETIMEDOUT')
      ) {
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
  url:
    'https://www.revitive.com/api/delivery/projects/revitiveUSA/entries/bf140712-339b-4ee4-a8e2-51771e9128f7?fields=sys.uri%2Csys.language',
  init: {
    retry: { retries: 2, minTimeout: 1000, factor: 2 },
    headers: {
      accesstoken: '5xGSwcT2EF8WZgGmZqeqZ0dHpgXI1nAzFprZlUelD0gPiuoi',
    },
  },
};

var goFetch = () => {
  var url = document.getElementById('url').value;
  var init = JSON.parse(document.getElementById('init').value || {});
  logFetch();
  enterpriseFetch(url, { ...fetchDefaults, ...init })
    .then((res) => {
      appendLog(
        'status: ' + res.status + ' ' + res.statusText,
        telemetry.fetchRequests
      );
      return res.text();
    })
    .then((text) => {
      addResponse(tryParse(text), telemetry.fetchRequests);
    })
    .catch((ex) => {
      addResponse(ex.toString(), telemetry.fetchRequests);
    });
};

var enterpriseFetch;

var onFetchLoaded = () => {
  document.getElementById('url').value = defaultRequest.url;
  var init = JSON.stringify(defaultRequest.init, null, 2);
  document.getElementById('init').value = init;
  // document.getElementById('init').setAttribute('data-replicated-value', init);

  // Autosize anything in the DOM on page load
  Array.from(document.querySelectorAll('textarea[autosize]')).forEach(autosize);

  // Setup observer to autosize anything after page load
  new MutationObserver((mutations) => {
    Array.from(mutations).forEach((mutation) => {
      Array.from(mutation.addedNodes).forEach((node) => {
        if (node.matches('textarea[autosize]')) {
          autosize(node);
        }
      });
    });
  }).observe(document.body, { childList: true });
};

var onEnterpriseFetchLoaded = () => {
  enterpriseFetch = efetch.default;
  document.getElementById('url').focus();
};
