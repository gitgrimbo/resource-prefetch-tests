const jsondiffpatch = require("jsondiffpatch");

function groupTests(result) {
  return Object.keys(result.tests).reduce(function(bucket, key) {
    var test = result.tests[key];
    var tests = bucket[test.name] = (bucket[test.name] || []);
    tests.push(test);
    return bucket;
  }, {});
}

function findMatchingTest(test, tests) {
  return tests.find(function(t) {
    return test.useCors === t.useCors &&
      test.crossDomain === t.crossDomain &&
      test.resource.src === t.resource.src;
  });
}

function findMatchingTests(result1, result2) {
  var bucket1 = groupTests(result1);
  var bucket2 = groupTests(result2);
  return Object.keys(bucket1).reduce(function(matches, k) {
    var tests1 = bucket1[k];
    tests1.forEach(function(t1) {
      matches.push({
        t1: t1,
        t2: findMatchingTest(t1, bucket2[k])
      });
    });
    return matches;
  }, []);
}

function del(src, path) {
  var p = path.split(".");
  var ob = src;
  for (var i = 0; i < p.length - 1; i++) {
    ob = ob[p[i]];
    if (!ob) {
      return src;
    }
  }
  delete ob[p[p.length - 1]];
  return src;
}

function get(src, path) {
  var p = path.split(".");
  var ob = src;
  for (var i = 0; i < p.length; i++) {
    ob = ob[p[i]];
    if (!ob) {
      return undefined;
    }
  }
  return ob;
}

function createComparisonObject(test) {
  var temp = {
    prefetch: {
      requested: get(test, "resource.server.prefetch.requested")
    },
    normal: {
      requested: get(test, "resource.server.normal.requested")
    }
  };

  return temp;
}

function createComparisonObject2(test) {
  var temp = {
    client: test.resource && test.resource.client,
    server: test.resource && test.resource.server
  };

  del(temp, "client.prefetch.data.event.timeStamp");
  del(temp, "client.prefetch.data.duration");
  del(temp, "client.prefetch.data.src");
  del(temp, "client.prefetch.err.duration");
  del(temp, "client.prefetch.err.event.timeStamp");
  del(temp, "server.prefetch.url");
  del(temp, "server.prefetch.requestHeaders");
  del(temp, "server.prefetch.responseHeaders");

  del(temp, "client.normal.data.event.timeStamp");
  del(temp, "client.normal.data.duration");
  del(temp, "client.normal.data.src");
  del(temp, "client.normal.err.duration");
  del(temp, "client.normal.err.event.timeStamp");
  del(temp, "server.normal.url");
  del(temp, "server.normal.requestHeaders");
  del(temp, "server.normal.responseHeaders");

  return temp;
}

function compare(result1, result2) {
  var sameCount = 0;
  var diffCount = 0;
  var matches = findMatchingTests(result1, result2);
  var diffs = matches.map(function(match) {
    var temp1 = createComparisonObject(match.t1);
    var temp2 = createComparisonObject(match.t2);
    var diff = jsondiffpatch.diff(temp1, temp2);
    var diffStr = JSON.stringify(diff, null, 1);
    if (diff) {
      diffCount++;
    } else {
      sameCount++;
    }
    console.log(diff ? "DIFF" : "SAME", match.t1.name, match.t1.crossDomain ? "XD" : "  ", match.t1.useCors ? "CORS" : "    ", match.t1.resource.src);
    if (diffStr) {
      console.log(diffStr.split("\n").map(function(s) {
        return "  " + s;
      }).join("\n"));
    }
  });
  console.log("same", sameCount);
  console.log("diff", diffCount);
  return diffs;
}

module.exports = {
  compare: compare
};
