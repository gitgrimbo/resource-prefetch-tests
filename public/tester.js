/* eslint-env browser, amd */
define([
  "./extend",
  "./prefetch",
  "./ajax-utils",
  "./promise-utils",
  "./url",
  "./tests",
  "./test-utils"
], function(extend, prefetch, ajaxUtils, promiseUtils, url, testList, testUtils) {
  var resolveWithDelay = promiseUtils.resolveWithDelay;

  var getter = ajaxUtils.getter;
  var poster = ajaxUtils.poster;

  var getConfig = getter("/config");
  var startNormalDownload = getter("/startNormalDownload");
  var startSession = getter("/startSession");
  var endSession = getter("/endSession");

  function addTestParams(src, resourceId, sessionId, testId, timestamp, useCors) {
    var addParams = url.addParams;
    useCors = (useCors === true);
    return addParams(src, {
      sessionId: sessionId,
      testId: testId,
      resourceId: resourceId,
      timestamp: timestamp,
      useCors: useCors
    });
  }

  function runTest(test, sessionId, testId, prefetchContainer) {
    console.log(test);
    prefetch.clearContainer();

    var timestamp = Date.now();
    var src = test.resource.src;

    if (test.protocol && test.hostname) {
      src = test.protocol + "//" + test.hostname + (test.port ? ":" + test.port : "") + src;
    }
    src = addTestParams(src, test.resourceId, sessionId, testId, timestamp, test.useCors);

    var ids = {
      sessionId: sessionId,
      testId: testId
    };

    var prefetchResult;
    var normalResult;

    function handleRejectAsResolve(promise) {
      return promise.then(function(data) {
        console.log(Date.now(), "handleRejectAsResolve.ok");
        return {
          data: data
        };
      }, function(err) {
        console.log(Date.now(), "handleRejectAsResolve.err");
        return {
          err: err
        };
      });
    }

    /**
     * If result has an "err" property, replace this property with a
     * simplified version so that result can be serialised to the server.
     */
    function cleanClientResultForPosting(result) {
      var err = result.err;
      if (!err) {
        return result;
      }
      // replace err with serializable version
      var cleaned = extend({}, result, {
        err: {
          name: err.name,
          message: err.message
        }
      });
      if (err.event) {
        cleaned.err.event = {
          type: err.event.type
        };
        if (err.event.target) {
          cleaned.err.event.target = err.event.target.tagName;
        }
      }
      return cleaned;
    }

    console.log(testId, test.name, "Starting test");
    var startTest = poster(url.addParams("/startTest", ids));
    return startTest({ test: test })
      .then(function() {
        console.log(testId, test.name, "Starting prefetch");
        return handleRejectAsResolve(test.prefetcher({
          src: src,
          container: prefetchContainer
        }, test.prefetchTimeoutMs));
      })
      .then(function(prefetchResult_) {
        prefetchResult = prefetchResult_;

        console.log(testId, test.name, "Prefetch complete", prefetchResult);

        return resolveWithDelay(100);
      })
      .then(function() {
        return startNormalDownload(ids);
      })
      .then(function() {
        console.log(testId, test.name, "Starting normal download");

        return handleRejectAsResolve(prefetch.loadResourceNormally({
          src: src,
          type: test.resource.type
        }, test.loadResourceNormallyTimeoutMs));
      })
      .then(function(normalResult_) {
        normalResult = normalResult_;

        console.log(testId, test.name, "Normal download complete", normalResult);
        console.log(testId, test.name, "Ending test");

        var endTest = poster(url.addParams("/endTest", ids));
        return endTest({
          client: {
            prefetch: cleanClientResultForPosting(prefetchResult),
            normal: cleanClientResultForPosting(normalResult)
          }
        });
      })
      .then(function(serverResult) {
        console.log(testId, test.name, "Test ended", serverResult);
        prefetch.clearContainer();
        var clientResult = {
          resource: {
            src: src,
            resourceId: test.resourceId,
            prefetchRequest: prefetchResult,
            normalRequest: normalResult
          }
        };
        return {
          testId: testId,
          test: test,
          serverResult: serverResult,
          clientResult: clientResult
        };
      })
      .catch(function(err) {
        console.log(testId, test.name, "catch", err);
      });
  }

  function combineTests(resources, testFilter, config, port) {
    var baseTests = testList;
    baseTests = testUtils.createTestsPerResource(baseTests, resources);
    var xdWithCorsTests = testUtils.createTestsForCrossDomain(baseTests, "http:", config.http2, port, true);
    var xdWithoutCorsTests = testUtils.createTestsForCrossDomain(baseTests, "http:", config.http2, port, false);

    var allTests = baseTests.concat(xdWithCorsTests, xdWithoutCorsTests);

    if (testFilter) {
      allTests = allTests.filter(testFilter);
    }

    return testUtils.sortTests(allTests);
  }

  function notifyListener(listener, type, data) {
    if (!listener) {
      return;
    }
    var f = listener["on" + type];
    if (!f) {
      return;
    }
    f(data);
  }

  function runTests(tests, sessionId, prefetchContainer, listener, i, results) {
    i = i || 0;
    results = results || [];

    console.log("runTests", i);

    if (i >= tests.length) {
      return Promise.resolve(results);
    }

    var test = tests[i];
    console.log(test);

    function callback(result) {
      notifyListener(listener, "TestComplete", {
        i: i,
        numTests: tests.length,
        test: test,
        result: result
      });
      console.log("runTests", "test " + i + " complete", result);
      results.push(result);
      return runTests(tests, sessionId, prefetchContainer, listener, i + 1, results);
    }

    function errback(err) {
      return callback(err);
    }

    return runTest(test, sessionId, i, prefetchContainer)
      .then(callback, errback);
  }

  function test(options) {
    options = options || {};

    prefetch.setContainer(options.prefetchContainer);

    var config;
    var sessionId;
    var results;
    var port = window.location.port;

    return getConfig()
      .then(function(config_) {
        config = config_;
      })
      .then(function() {
        console.log("Starting session");
        return startSession({
          userAgent: navigator.userAgent
        });
      })
      .then(function(response) {
        sessionId = response.sessionId;
        notifyListener(options.listener, "SessionStarted", {
          sessionId: sessionId
        });
      })
      .then(function() {
        console.log("Running tests");
        var allTests = combineTests(options.resources, options.testFilter, config, port);
        allTests.forEach(function(test) {
          test.prefetchTimeoutMs = 5 * 1000;
          test.loadResourceNormallyTimeoutMs = 5 * 1000;
        });
        //allTests = allTests.slice(0, 1);
        console.log(allTests);
        return runTests(allTests, sessionId, options.prefetchContainer, options.listener);
      })
      .then(function(results_) {
        results = results_;
        console.log(results);
      })
      .then(function() {
        console.log("Ending session");
        return endSession({
          sessionId: sessionId
        });
      })
      .then(function(session) {
        notifyListener(options.listener, "SessionEnded", {
          sessionId: sessionId,
          session: session
        });
        console.log("Returning results");
        return session;
      });
  }

  return test;
});
