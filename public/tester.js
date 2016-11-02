/* eslint-disable no-console */
import prefetch from "./prefetch";
import ajaxUtils from "./ajax-utils";
import promiseUtils from "./promise-utils";
import url from "./url";
import testList from "./tests";
import testUtils from "./test-utils";

var resolveWithDelay = promiseUtils.resolveWithDelay;

var poster = ajaxUtils.poster;

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

async function runTest(test, sessionId, testId, prefetchContainer) {
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

  async function handleRejectAsResolve(promise) {
    var start = Date.now();
    try {
      var data = await promise;
      console.log(Date.now(), "handleRejectAsResolve.ok");
      return {
        data: data
      };
    } catch (err) {
      console.log(Date.now(), "handleRejectAsResolve.err");
      if (typeof err.duration === "undefined") {
        err.duration = Date.now() - start;
      }
      return {
        err: err
      };
    }
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
    return Object.assign({}, result, {
      err: {
        name: err.name,
        message: err.message,
        // event should have been simplified (serialisable) by resource-loader
        event: err.event,
        duration: err.duration
      }
    });
  }

  async function sendPrefetchRequest() {
    console.log(testId, test.name, "Sending prefetch request");
    var prefetchResult = await handleRejectAsResolve(test.prefetcher({
      src: src,
      container: prefetchContainer
    }, test.prefetchTimeoutMs));
    console.log(testId, test.name, "Prefetch request complete", prefetchResult);
    return prefetchResult;
  }

  async function sendNormalRequest() {
    console.log(testId, test.name, "Sending normal request");
    var normalResult = await handleRejectAsResolve(prefetch.loadResourceNormally({
      src: src,
      type: test.resource.type
    }, test.loadResourceNormallyTimeoutMs));
    console.log(testId, test.name, "Normal request complete", normalResult);
    return normalResult;
  }

  try {
    console.log(testId, test.name, "Starting test");
    var startTest = poster(url.addParams("/startTest", ids));
    await startTest({ test: test });
    var prefetchResult = await sendPrefetchRequest();
    await resolveWithDelay(100, "ignore-me");

    var startNormalDownload = poster(url.addParams("/startNormalDownload", ids));
    const testFromServer = await startNormalDownload();

    // default
    var normalResult = {};
    var server = testFromServer.resource.server;
    if (!server || !server.prefetch || !server.prefetch.requested) {
      // Prefetch request never made it to the server.
      // Don't bother with the normal request.
      console.log(testId, test.name, "Prefetch request never made it to the server. Skipping normal request.");
    } else {
      // Otherwise, proceed with normal request.
      normalResult = await sendNormalRequest();
    }

    var endTest = poster(url.addParams("/endTest", ids));
    const serverResult = await endTest({
      client: {
        prefetch: cleanClientResultForPosting(prefetchResult),
        normal: cleanClientResultForPosting(normalResult)
      }
    });

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
  } catch (err) {
    console.log(testId, test.name, "catch", err);
  }
}

function combineTests(resources, testFilter, config, port) {
  var baseTests = testUtils.combineTests(testList, resources, testFilter, config.http2, port);
  return baseTests.map(function(test) {
    return Object.assign(test, {
      // The prefetcher functions here should have been 'timeoutified' already.
      // See prefetch.js
      prefetcher: prefetch[test.prefetcherName]
    });
  });
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

async function test(options) {
  options = options || {};

  prefetch.setContainer(options.prefetchContainer);

  var port = window.location.port;

  var getConfig = poster("/config");
  var config = await getConfig();
  console.log("config", config);

  console.log("Starting session");
  var startSession = poster("/startSession");
  var session = await startSession({
    userAgent: navigator.userAgent
  });

  var sessionId = session.sessionId;
  notifyListener(options.listener, "SessionStarted", session);

  console.log("Running tests");
  var allTests = combineTests(options.resources, options.testFilter, config, port);
  allTests.forEach(function(test) {
    test.prefetchTimeoutMs = 3.5 * 1000;
    test.loadResourceNormallyTimeoutMs = 3.5 * 1000;
  });
  //allTests = allTests.slice(0, 1);
  console.log(allTests);
  var results = await runTests(allTests, sessionId, options.prefetchContainer, options.listener);
  console.log(results);

  console.log("Ending session");
  var endSession = poster(url.addParams("/endSession", {
    sessionId: sessionId
  }));
  session = await endSession();

  notifyListener(options.listener, "SessionEnded", {
    sessionId: sessionId,
    session: session
  });
  console.log("Returning results");
  return session;
}

export default test;
