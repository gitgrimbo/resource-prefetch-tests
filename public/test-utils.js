/* eslint-env browser, amd */
define(["./extend"], function(extend) {
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

  /**
   * Sorts the tests by
   * - name
   * - crossDomain
   * - useCors
   * - resource type
   * - resource src
   * @param {test[]} tests Array of tests
   * @return {test[]} Array of tests
   */
  function sortTests(tests) {
    var sorters = [
      function(a, b) {
        return a.name.localeCompare(b.name);
      },
      function(a, b) {
        if (a.crossDomain === b.crossDomain) return 0;
        return a.crossDomain ? 1 : -1;
      },
      function(a, b) {
        if (a.useCors === b.useCors) return 0;
        return a.useCors ? 1 : -1;
      },
      function(a, b) {
        return a.resource.type.localeCompare(b.resource.type);
      },
      function(a, b) {
        return a.resource.src.localeCompare(b.resource.src);
      }
    ];
    tests.sort(function(a, b) {
      for (var i = 0; i < sorters.length; i++) {
        var val = sorters[i](a, b);
        if (val !== 0) {
          return val;
        }
      }
      return 0;
    });
    return tests;
  }

  return {
    createTestsPerResource: createTestsPerResource,
    createTestsForCrossDomain: createTestsForCrossDomain,
    sortTests: sortTests
  };
});
