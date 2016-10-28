/* eslint-env browser, amd */
define([], function() {
  function createTestsPerResource(tests, resources) {
    return tests.reduce(function(tests, test) {
      resources.forEach(function(r, i) {
        tests.push(Object.assign({}, test, {
          resourceId: i,
          resource: r
        }));
      });
      return tests;
    }, []);
  }

  function createTestsForCrossDomain(tests, protocol, hostname, port, useCors) {
    return tests.map(function(test) {
      return Object.assign({}, test, {
        protocol: protocol,
        hostname: hostname,
        port: port,
        useCors: useCors,
        crossDomain: true
      });
    });
  }

  function combineTests(testList, resources, testFilter, xdDomain, port) {
    var baseTests = testList.concat();
    baseTests = createTestsPerResource(baseTests, resources);

    var useCors = true;
    var xdWithCorsTests = createTestsForCrossDomain(baseTests, "http:", xdDomain, port, useCors);
    var dontUseCors = false;
    var xdWithoutCorsTests = createTestsForCrossDomain(baseTests, "http:", xdDomain, port, dontUseCors);

    var allTests = baseTests.concat(xdWithCorsTests, xdWithoutCorsTests);

    if (testFilter) {
      allTests = allTests.filter(testFilter);
    }

    return sortTests(allTests);
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
    combineTests: combineTests,
    createTestsPerResource: createTestsPerResource,
    createTestsForCrossDomain: createTestsForCrossDomain,
    sortTests: sortTests
  };
});
