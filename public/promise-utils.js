/* eslint-env browser, amd */
define(["./extend"], function(extend) {
  function rejectWith(reject, value, attrs) {
    return function() {
      var e = (value instanceof Error) ? value : new Error(value);
      extend(e, attrs);
      reject(e);
    };
  }

  function resolveWith(resolve, value) {
    return function() {
      resolve(value);
    };
  }

  function resolveWithDelay(ms, value) {
    ms = ms || 0;
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(value);
      }, ms);
    });
  }

  function timeoutify(fn, msg) {
    return function(opts, timeout) {
      var promise = fn(opts);
      return timeout ? promise.timeout(timeout, msg) : promise;
    };
  }

  function countdownResolver(resolve, count) {
    var results = [];
    return {
      callback: function(i) {
        return function(data) {
          results[i] = {
            data: data
          };
          if (--count === 0) {
            resolve(results);
          }
        };
      },
      errback: function(i) {
        return function(err) {
          results[i] = {
            err: err
          };
          if (--count === 0) {
            resolve(results);
          }
        };
      }
    };
  }

  return {
    rejectWith: rejectWith,
    resolveWith: resolveWith,
    resolveWithDelay: resolveWithDelay,
    timeoutify: timeoutify,
    countdownResolver: countdownResolver
  };
});
