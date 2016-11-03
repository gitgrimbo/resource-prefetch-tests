function rejectWith(reject, value, attrs) {
  return function() {
    var e = (value instanceof Error) ? value : new Error(value);
    Object.assign(e, attrs);
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

function poll(predicate, delay, timeout) {
  if (typeof delay !== "number" || delay < 0) {
    delay = 100;
  }
  if (typeof timeout !== "number" || timeout < 0) {
    timeout = 1000;
  }
  function _poll() {
    const value = predicate();
    if (typeof value !== "undefined") {
      return Promise.resolve(value);
    }

    const elapsed = Date.now() - start;
    if (elapsed > timeout) {
      return Promise.reject(Object.assign(new Error("timeout"), {
        delay,
        timeout,
        duration: elapsed
      }));
    }

    return Promise.delay(delay).then(_poll);
  }
  const start = Date.now();
  return _poll();
}

module.exports = {
  rejectWith: rejectWith,
  resolveWith: resolveWith,
  resolveWithDelay: resolveWithDelay,
  timeoutify: timeoutify,
  countdownResolver: countdownResolver,
  poll: poll
};
