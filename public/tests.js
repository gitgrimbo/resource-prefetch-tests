/* eslint-env browser, amd */
define(["./prefetch", "./promise-utils", "./extend"], function(prefetch, promiseUtils, extend) {
  // The prefetcher functions here should have been 'timeoutified' already.
  // See prefetch.js
  var tests = [
    {
      name: "new Image()",
      prefetcher: prefetch.loadResourceByNewImage
    }, {
      name: "XHR",
      prefetcher: prefetch.loadResourceByXHR
    }, {
      name: "<object>",
      prefetcher: prefetch.loadResourceByObjectTag
    }, {
      name: "<link rel=prefetch>",
      prefetcher: prefetch.loadResourceByLinkRelPrefetchTag
    }
  ];

  function createTestsPerResource(tests, resources) {
    return tests.reduce(function(tests, test) {
      resources.forEach(function(r, i) {
        tests.push(extend({}, test, {
          resourceId: i,
          resource: r
        }));
      });
      return tests;
    }, []);
  }

  function createTestsForCrossDomain(tests, protocol, hostname, port, useCors) {
    return tests.map(function(test) {
      return extend({}, test, {
        protocol: protocol,
        hostname: hostname,
        port: port,
        useCors: useCors,
        crossDomain: true
      });
    });
  }

  return {
    createTestsPerResource: createTestsPerResource,
    createTestsForCrossDomain: createTestsForCrossDomain,
    tests: tests
  };
});
