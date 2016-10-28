/* eslint-env amd */
define([
  "intern",
  "intern!object",
  "../../public/tests"
], function(intern, registerSuite, tests) {
  function makeTestUrl(url, testName) {
    const char = (url.indexOf("?") > 1) ? "&" : "?";
    return url + char + "test.name=" + encodeURIComponent(testName);
  }

  const suite = {
    name: "functional"
  };

  tests.forEach((test) => {
    suite[test.name] = function() {
      // It's a long test so timeout after an hour.
      // Both the test timeout, and the async timeout need to be long.
      const oneHour = 60 * 60 * 1000;
      this.timeout = oneHour;
      const executeAsyncTimeout = oneHour;
      const findTimeout = oneHour;

      const config = intern.config;
      const url = makeTestUrl(config.testHarnessUrl, test.name);

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
  });

  registerSuite(suite);
});
