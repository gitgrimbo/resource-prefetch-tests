/* eslint-env amd */
define([
  "intern",
  "intern!object",
  "intern/dojo/node!url",
  "intern/dojo/node!../../server/test-config",
  "../../public/resources",
  "../../public/tests",
  "../../public/test-utils"
], function(intern, registerSuite, url, testConfig, resources, tests, testUtils) {
  function makeTestUrl(url, testName, useCors, crossDomain) {
    const char = (url.indexOf("?") > 1) ? "&" : "?";
    const params = [];
    if (typeof testName !== "undefined") {
      params.push(["test.name", testName]);
    }
    if (typeof crossDomain !== "undefined") {
      params.push(["test.crossDomain", crossDomain]);
    }
    if (typeof useCors !== "undefined") {
      params.push(["test.useCors", useCors]);
    }
    if (params.length > 0) {
      return url + char + params
        .map((p) => p[0] + "=" + encodeURIComponent(p[1]))
        .join("&");
    }
    return url;
  }

  function makeTest(name, userCors, crossDomain) {
    return function() {
      // It's a long test so timeout after an hour.
      // Both the test timeout, and the async timeout need to be long.
      const oneHour = 60 * 60 * 1000;
      this.timeout = oneHour;
      const executeAsyncTimeout = oneHour;
      const findTimeout = oneHour;

      const url = makeTestUrl(config.testHarnessUrl, name, userCors, crossDomain);

      return this.remote
        .setFindTimeout(findTimeout)
        .setExecuteAsyncTimeout(executeAsyncTimeout)
        .get(url)
        .executeAsync(function(done) {
          function checkForResults() {
            // eslint-disable-next-line
            var results = (typeof window.resourcePrefetchTestResults !== "undefined") ? window.resourcePrefetchTestResults : null;
            if (results) {
              return done(results);
            }
            setTimeout(checkForResults, 5 * 1000);
          }
          checkForResults();
        });
    };
  }

  const suite = {
    name: "functional"
  };

  const config = intern.config;
  const parsed = url.parse(config.testHarnessUrl);
  tests = testUtils.combineTests(tests, resources, null, testConfig.http2, parsed.port);

  tests.forEach((test) => {
    suite[test.name] = makeTest(test.name, "!true", "!true");
    suite[test.name + "-xd"] = makeTest(test.name, "!true", "true");
    suite[test.name + "-xd-cors"] = makeTest(test.name, "true", "true");
  });

  registerSuite(suite);
});
