var efetch = (function (exports, fetch) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var fetch__default = /*#__PURE__*/_interopDefaultLegacy(fetch);

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(Object(source), true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }

    return target;
  }

  function _objectWithoutProperties(source, excluded) {
    if (source == null) return {};

    var target = _objectWithoutPropertiesLoose(source, excluded);

    var key, i;

    if (Object.getOwnPropertySymbols) {
      var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

      for (i = 0; i < sourceSymbolKeys.length; i++) {
        key = sourceSymbolKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
        target[key] = source[key];
      }
    }

    return target;
  }

  function assign(obj, props) {
      for (const key in props) {
          Object.defineProperty(obj, key, {
              value: props[key],
              enumerable: true,
              configurable: true,
          });
      }

      return obj;
  }

  function createError(err, code, props) {
      if (!err || typeof err === 'string') {
          throw new TypeError('Please pass an Error to err-code');
      }

      if (!props) {
          props = {};
      }

      if (typeof code === 'object') {
          props = code;
          code = undefined;
      }

      if (code != null) {
          props.code = code;
      }

      try {
          return assign(err, props);
      } catch (_) {
          props.message = err.message;
          props.stack = err.stack;

          const ErrClass = function () {};

          ErrClass.prototype = Object.create(Object.getPrototypeOf(err));

          return assign(new ErrClass(), props);
      }
  }

  var errCode = createError;

  function createCommonjsModule(fn) {
    var module = { exports: {} };
  	return fn(module, module.exports), module.exports;
  }

  function RetryOperation(timeouts, options) {
    // Compatibility for the old (timeouts, retryForever) signature
    if (typeof options === 'boolean') {
      options = { forever: options };
    }

    this._originalTimeouts = JSON.parse(JSON.stringify(timeouts));
    this._timeouts = timeouts;
    this._options = options || {};
    this._maxRetryTime = options && options.maxRetryTime || Infinity;
    this._fn = null;
    this._errors = [];
    this._attempts = 1;
    this._operationTimeout = null;
    this._operationTimeoutCb = null;
    this._timeout = null;
    this._operationStart = null;

    if (this._options.forever) {
      this._cachedTimeouts = this._timeouts.slice(0);
    }
  }
  var retry_operation = RetryOperation;

  RetryOperation.prototype.reset = function() {
    this._attempts = 1;
    this._timeouts = this._originalTimeouts;
  };

  RetryOperation.prototype.stop = function() {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }

    this._timeouts       = [];
    this._cachedTimeouts = null;
  };

  RetryOperation.prototype.retry = function(err) {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }

    if (!err) {
      return false;
    }
    var currentTime = new Date().getTime();
    if (err && currentTime - this._operationStart >= this._maxRetryTime) {
      this._errors.unshift(new Error('RetryOperation timeout occurred'));
      return false;
    }

    this._errors.push(err);

    var timeout = this._timeouts.shift();
    if (timeout === undefined) {
      if (this._cachedTimeouts) {
        // retry forever, only keep last error
        this._errors.splice(this._errors.length - 1, this._errors.length);
        this._timeouts = this._cachedTimeouts.slice(0);
        timeout = this._timeouts.shift();
      } else {
        return false;
      }
    }

    var self = this;
    var timer = setTimeout(function() {
      self._attempts++;

      if (self._operationTimeoutCb) {
        self._timeout = setTimeout(function() {
          self._operationTimeoutCb(self._attempts);
        }, self._operationTimeout);

        if (self._options.unref) {
            self._timeout.unref();
        }
      }

      self._fn(self._attempts);
    }, timeout);

    if (this._options.unref) {
        timer.unref();
    }

    return true;
  };

  RetryOperation.prototype.attempt = function(fn, timeoutOps) {
    this._fn = fn;

    if (timeoutOps) {
      if (timeoutOps.timeout) {
        this._operationTimeout = timeoutOps.timeout;
      }
      if (timeoutOps.cb) {
        this._operationTimeoutCb = timeoutOps.cb;
      }
    }

    var self = this;
    if (this._operationTimeoutCb) {
      this._timeout = setTimeout(function() {
        self._operationTimeoutCb();
      }, self._operationTimeout);
    }

    this._operationStart = new Date().getTime();

    this._fn(this._attempts);
  };

  RetryOperation.prototype.try = function(fn) {
    console.log('Using RetryOperation.try() is deprecated');
    this.attempt(fn);
  };

  RetryOperation.prototype.start = function(fn) {
    console.log('Using RetryOperation.start() is deprecated');
    this.attempt(fn);
  };

  RetryOperation.prototype.start = RetryOperation.prototype.try;

  RetryOperation.prototype.errors = function() {
    return this._errors;
  };

  RetryOperation.prototype.attempts = function() {
    return this._attempts;
  };

  RetryOperation.prototype.mainError = function() {
    if (this._errors.length === 0) {
      return null;
    }

    var counts = {};
    var mainError = null;
    var mainErrorCount = 0;

    for (var i = 0; i < this._errors.length; i++) {
      var error = this._errors[i];
      var message = error.message;
      var count = (counts[message] || 0) + 1;

      counts[message] = count;

      if (count >= mainErrorCount) {
        mainError = error;
        mainErrorCount = count;
      }
    }

    return mainError;
  };

  var retry$1 = createCommonjsModule(function (module, exports) {
  exports.operation = function(options) {
    var timeouts = exports.timeouts(options);
    return new retry_operation(timeouts, {
        forever: options && options.forever,
        unref: options && options.unref,
        maxRetryTime: options && options.maxRetryTime
    });
  };

  exports.timeouts = function(options) {
    if (options instanceof Array) {
      return [].concat(options);
    }

    var opts = {
      retries: 10,
      factor: 2,
      minTimeout: 1 * 1000,
      maxTimeout: Infinity,
      randomize: false
    };
    for (var key in options) {
      opts[key] = options[key];
    }

    if (opts.minTimeout > opts.maxTimeout) {
      throw new Error('minTimeout is greater than maxTimeout');
    }

    var timeouts = [];
    for (var i = 0; i < opts.retries; i++) {
      timeouts.push(this.createTimeout(i, opts));
    }

    if (options && options.forever && !timeouts.length) {
      timeouts.push(this.createTimeout(i, opts));
    }

    // sort the array numerically ascending
    timeouts.sort(function(a,b) {
      return a - b;
    });

    return timeouts;
  };

  exports.createTimeout = function(attempt, opts) {
    var random = (opts.randomize)
      ? (Math.random() + 1)
      : 1;

    var timeout = Math.round(random * opts.minTimeout * Math.pow(opts.factor, attempt));
    timeout = Math.min(timeout, opts.maxTimeout);

    return timeout;
  };

  exports.wrap = function(obj, options, methods) {
    if (options instanceof Array) {
      methods = options;
      options = null;
    }

    if (!methods) {
      methods = [];
      for (var key in obj) {
        if (typeof obj[key] === 'function') {
          methods.push(key);
        }
      }
    }

    for (var i = 0; i < methods.length; i++) {
      var method   = methods[i];
      var original = obj[method];

      obj[method] = function retryWrapper(original) {
        var op       = exports.operation(options);
        var args     = Array.prototype.slice.call(arguments, 1);
        var callback = args.pop();

        args.push(function(err) {
          if (op.retry(err)) {
            return;
          }
          if (err) {
            arguments[0] = op.mainError();
          }
          callback.apply(this, arguments);
        });

        op.attempt(function() {
          original.apply(obj, args);
        });
      }.bind(obj, original);
      obj[method].options = options;
    }
  };
  });

  var retry = retry$1;

  var hasOwn = Object.prototype.hasOwnProperty;

  function isRetryError(err) {
      return err && err.code === 'EPROMISERETRY' && hasOwn.call(err, 'retried');
  }

  function promiseRetry(fn, options) {
      var temp;
      var operation;

      if (typeof fn === 'object' && typeof options === 'function') {
          // Swap options and fn when using alternate signature (options, fn)
          temp = options;
          options = fn;
          fn = temp;
      }

      operation = retry.operation(options);

      return new Promise(function (resolve, reject) {
          operation.attempt(function (number) {
              Promise.resolve()
              .then(function () {
                  return fn(function (err) {
                      if (isRetryError(err)) {
                          err = err.retried;
                      }

                      throw errCode(new Error('Retrying'), 'EPROMISERETRY', { retried: err });
                  }, number);
              })
              .then(resolve, function (err) {
                  if (isRetryError(err)) {
                      err = err.retried;

                      if (operation.retry(err || new Error())) {
                          return;
                      }
                  }

                  reject(err);
              });
          });
      });
  }

  var promiseRetry_1 = promiseRetry;

  /*globals self, window */

  /*eslint-disable @mysticatea/prettier */
  const { AbortController, AbortSignal } =
      typeof self !== "undefined" ? self :
      typeof window !== "undefined" ? window :
      /* otherwise */ undefined;
  /*eslint-enable @mysticatea/prettier */

  var browser = AbortController;
  var AbortSignal_1 = AbortSignal;
  var _default = AbortController;
  browser.AbortSignal = AbortSignal_1;
  browser.default = _default;

  /**
   * @param { Promise } promise
   * @param { Object= } errorExt - Additional Information you can pass to the err object
   * @return { Promise }
   */
  function to(promise, errorExt) {
      return promise
          .then(function (data) { return [null, data]; })
          .catch(function (err) {
          if (errorExt) {
              Object.assign(err, errorExt);
          }
          return [err, undefined];
      });
  }

  const fetchDefaults = {
    // The timeout to apply to requests that do not supply a timeout option
    timeout: 60 * 1000,
    // Retry policy for all fetch requests
    retry: {
      retries: 3,
      minTimeout: 400,
      factor: 2
    },
    // Do retry function to examine failures and apply custom retry logic
    // return true to retry the fetch call
    doRetry: async (attempt, res, {
      url,
      options
    }) => {
      // Get the retry policy from options or fetchDefaults
      const {
        retry = fetchDefaults.retry
      } = options;

      if (attempt <= retry.retries) {
        const counter = `${attempt}/${retry.retries}`;
        if ('message' in res) console.warn(`[fetch] Attempt ${counter} ${res.name}: ${res.message} ${url}`);else console.warn(`[fetch] Attempt ${counter} ${res.status}: ${res.statusText} ${url}`); // Retry request on any network error,
        // or 4xx or 5xx status codes. No retry on 404

        if (!res.status || res.status >= 400 && res.status !== 404) {
          return true;
        }
      }

      return false;
    }
  };

  // Setting http_proxy in env will inject a proxy agent header and disable certificate verification
  const proxyAgent = async () => {
    const proxyUri = typeof process !== 'undefined' && process.env.http_proxy || false;

    if (proxyUri) {
      console.info(`Proxying via http_proxy: ${process.env.http_proxy}`);
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      const {
        HttpsProxyAgent
      } = await ('https-proxy-agent');
      return {
        agent: new HttpsProxyAgent(proxyUri)
      };
    }

    return {};
  };

  const isFunc = func => typeof func === 'function';

  const isClient = () => typeof window !== 'undefined';

  const thisFetch = isClient() ? window.fetch : fetch__default['default'];
  const fetchWithDefaults = (fetchDefaults$1 = fetchDefaults) => {
    // Fetch function using hoisted defaults wrapped in a promise
    // retry function adhering to a default or supplied policy calling
    // a doRetry function on each failure that requires a boolean return
    const enterpriseFetch = async (url, init = {}) => {
      const fetchResponse = await promiseRetry_1(async (retry, attempt) => {
        const {
          retry: retryPolicy = fetchDefaults$1.retry,
          timeout: rtimeout = fetchDefaults$1.timeout,
          doRetry = fetchDefaults$1.doRetry || fetchDefaults.doRetry
        } = init,
              options = _objectWithoutProperties(init, ["retry", "timeout", "doRetry"]);

        const timeoutMs = rtimeout || fetchDefaults$1.timeout || 60 * 1000; // Abort signal pattern

        const controller = new browser();
        setTimeout(() => {
          controller.abort();
        }, timeoutMs); // Try fetching, wait for error or response

        const [error, response] = await to(thisFetch(url, _objectSpread2(_objectSpread2(_objectSpread2({}, options), await proxyAgent()), {}, {
          // The signal will recieve abort() after timeout elapsed
          signal: controller.signal
        })));

        if (error) {
          if (isFunc(doRetry) && (await doRetry(attempt, error, {
            url,
            options: init
          }))) {
            retry(error);
          }

          throw error;
        }

        if (!response.ok) {
          if (isFunc(doRetry) && (await doRetry(attempt, response, {
            url,
            options: init
          }))) {
            retry(response);
          }

          return response;
        }

        return response;
      }, init.retry || fetchDefaults$1.retry);
      return fetchResponse;
    };

    return enterpriseFetch;
  };
  var enterpriseFetch = fetchWithDefaults(fetchDefaults);

  exports.default = enterpriseFetch;
  exports.fetchWithDefaults = fetchWithDefaults;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}, fetch));
