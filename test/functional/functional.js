/* eslint-env amd */
define([
  "intern",
  "intern!object"
], function(intern, registerSuite, ResourcesCollector) {
  registerSuite({
    name: "functional",

    test() {
      // It's a long test so timeout after an hour.
      // Both the test timeout, and the async timeout need to be long.
      const oneHour = 60 * 60 * 1000;
      this.timeout = oneHour;
      const executeAsyncTimeout = oneHour;

      const findTimeout = 10 * 1000;

      const config = intern.config;
      const url = config.testHarnessUrl;

      return this.remote
        .setFindTimeout(findTimeout)
        .setExecuteAsyncTimeout(executeAsyncTimeout)
        .get(url)
        .executeAsync(function(done) {
          function checkForResults() {
            // eslint-disable-next-line
            var results = (typeof window.resourcePrefetchTestResults !== "undefined") ? window.resourcePrefetchTestResults: null;
            if (results) {
              return done(results);
            }
            setTimeout(checkForResults, 5 * 1000);
          }
          checkForResults();
        });
    }
  });
});
