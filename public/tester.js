/* eslint-disable no-console */
const prefetch = require("./prefetch");
const ajaxUtils = require("./ajax-utils");
const promiseUtils = require("./promise-utils");
const url = require("./url");
const testList = require("./tests");
const testUtils = require("./test-utils");

const resolveWithDelay = promiseUtils.resolveWithDelay;

const poster = ajaxUtils.poster;

function addTestParams(src, resourceId, sessionId, testId, timestamp, useCors) {
  const addParams = url.addParams;
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

  const timestamp = Date.now();
  let src = test.resource.src;

  if (test.protocol && test.hostname) {
    src = test.protocol + "//" + test.hostname + (test.port ? ":" + test.port : "") + src;
  }
  src = addTestParams(src, test.resourceId, sessionId, testId, timestamp, test.useCors);

  const ids = {
    sessionId: sessionId,
    testId: testId
  };

  async function handleRejectAsResolve(promise) {
    const start = Date.now();
    try {
      const data = await promise;
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
    const err = result.err;
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
    const prefetchResult = await handleRejectAsResolve(test.prefetcher({
      src: src,
      container: prefetchContainer
    }, test.prefetchTimeoutMs));
    console.log(testId, test.name, "Prefetch request complete", prefetchResult);
    return prefetchResult;
  }

  async function sendNormalRequest() {
    console.log(testId, test.name, "Sending normal request");
    const normalResult = await handleRejectAsResolve(prefetch.loadResourceNormally({
      src: src,
      type: test.resource.type
    }, test.loadResourceNormallyTimeoutMs));
    console.log(testId, test.name, "Normal request complete", normalResult);
    return normalResult;
  }

  try {
    console.log(testId, test.name, "Starting test");
    const startTest = poster(url.addParams("/startTest", ids));
    await startTest({ test: test });
    const prefetchResult = await sendPrefetchRequest();
    await resolveWithDelay(100, "ignore-me");

    const startNormalDownload = poster(url.addParams("/startNormalDownload", ids));
    const testFromServer = await startNormalDownload();

    // default
    let normalResult = {};
    const server = testFromServer.resource.server;
    if (!server || !server.prefetch || !server.prefetch.requested) {
      // Prefetch request never made it to the server.
      // Don't bother with the normal request.
      console.log(testId, test.name, "Prefetch request never made it to the server. Skipping normal request.");
    } else {
      // Otherwise, proceed with normal request.
      normalResult = await sendNormalRequest();
    }

    const endTest = poster(url.addParams("/endTest", ids));
    const serverResult = await endTest({
      client: {
        src: src,
        prefetch: cleanClientResultForPosting(prefetchResult),
        normal: cleanClientResultForPosting(normalResult)
      }
    });

    console.log(testId, test.name, "Test ended", serverResult);
    prefetch.clearContainer();
    const rawClientResult = {
      prefetch: prefetchResult,
      normal: normalResult
    };
    return {
      testId: testId,
      test: test,
      serverResult: serverResult,
      rawClientResult: rawClientResult
    };
  } catch (err) {
    console.log(testId, test.name, "catch", err);
  }
}

function combineTests(resources, testFilter, config, port) {
  const baseTests = testUtils.combineTests(testList, resources, testFilter, config.http2, port);
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
  const f = listener["on" + type];
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

  const test = tests[i];
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

  const port = window.location.port;

  const getConfig = poster("/config");
  const config = await getConfig();
  console.log("config", config);

  console.log("Starting session");
  const startSession = poster("/startSession");
  let session = await startSession({
    userAgent: navigator.userAgent
  });

  const sessionId = session.sessionId;
  notifyListener(options.listener, "SessionStarted", session);

  console.log("Running tests");
  const allTests = combineTests(options.resources, options.testFilter, config, port);
  allTests.forEach(function(test) {
    test.prefetchTimeoutMs = 3.5 * 1000;
    test.loadResourceNormallyTimeoutMs = 3.5 * 1000;
  });
  //allTests = allTests.slice(0, 1);
  console.log(allTests);
  const results = await runTests(allTests, sessionId, options.prefetchContainer, options.listener);
  console.log(results);

  console.log("Ending session");
  const endSession = poster(url.addParams("/endSession", {
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

module.exports = test;
