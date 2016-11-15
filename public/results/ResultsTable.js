const $ = require("jquery");
const Mustache = require("mustache");

function filterOutFalseys(it) {
  return Boolean(it);
}

function headersList(headers) {
  if (!headers) {
    return "";
  }
  var omit = {
    "user-agent": 1,
    "referer": 1
  };
  var keys = Object.keys(headers).filter(function(name) {
    return !(name.toLowerCase() in omit);
  });
  return keys.map(function(name) {
    return name + "=" + headers[name];
  }).join("\n");
}

class ResultsTable {
  constructor(opts) {
    opts = opts || {};
    this.tableTemplate = opts.tableTemplate;
    this.rowTemplate = opts.rowTemplate;
    this.headersRowTemplate = opts.headersRowTemplate;
    this.escapeHtml = opts.escapeHtml;
    Mustache.parse(opts.tableTemplate);
    Mustache.parse(opts.rowTemplate);
    Mustache.parse(opts.headersRowTemplate);
  }

  clientErrorToLines(err) {
    var lines = [];
    if (err.name === "TimeoutError") {
      lines.push("Client timeout waiting for load/error event");
    } else if (err.event) {
      var event = err.event;
      var msg = event.target + ":" + event.type + " fired.";
      lines.push(msg);
    } else if (err.name) {
      lines.push(err.name + ": " + err.message);
    } else {
      lines.push("onError: " + this.escapeHtml(err));
    }
    return lines;
  }

  testResultsToRowData(data) {
    const getPathWithoutParams = (result) => {
      var resource = result.serverResult.resource;
      var client = resource.client;
      var server = resource.server;

      // If server.path does not exist, it means neither a prefetch
      // nor a normal request made it to the server.
      // Otherwise use client.src, which is the URL used to make
      // (or rather not make) the request.
      // If neither of the above are present, use resource.src,
      // which is the non-absolute URL.
      let pathWithoutParams = resource.src;
      if (server && server.path) {
        pathWithoutParams = server.path.split("?")[0];
      } else if (client && client.src) {
        pathWithoutParams = client.src.split("?")[0];
      }
      return pathWithoutParams;
    };

    const test = data.test;

    let results = data.result;
    if (!Array.isArray(results)) {
      results = [results];
    }

    const addClientInfo = (info, context) => {
      if (context.err) {
        this.clientErrorToLines(context.err).forEach((line) => {
          info.push(line);
        });
      } else if (context.data) {
        if (context.data.event) {
          info.push(context.data.event.target + ":" + context.data.event.type + " fired.");
        }
      }
    };

    const duration = (context) => {
      if (context.err && typeof context.err.duration === "number") {
        return context.err.duration;
      }
      if (context.data && typeof context.data.duration === "number") {
        return context.data.duration;
      }
      return null;
    };

    var prefetchNormalPairs = results.map((result) => {
      var resource = result.serverResult.resource;
      var client = resource.client;
      var server = resource.server;

      var serverPrefetch = server && server.prefetch;
      var serverNormal = server && server.normal;
      var prefetchResponseStatusCode = serverPrefetch && serverPrefetch.statusCode;
      var normalResponseStatusCode = serverNormal && serverNormal.statusCode;

      var prefetchRequestReceivedByServer = Boolean(prefetchResponseStatusCode);
      var normalRequestReceivedByServer = Boolean(normalResponseStatusCode);
      var pass = Boolean(prefetchRequestReceivedByServer && !normalRequestReceivedByServer);

      var prefetchInfo = [];
      var normalInfo = [];

      if (!prefetchRequestReceivedByServer) {
        prefetchInfo.push("Failed to be prefetched");
      } else if (normalRequestReceivedByServer) {
        normalInfo.push("Requested again");
      }

      var prefetchDuration = null;
      var normalDuration = null;

      if (client && client.prefetch) {
        prefetchDuration = duration(client.prefetch);
        addClientInfo.call(this, prefetchInfo, client.prefetch);
      }
      if (client && client.normal) {
        normalDuration = duration(client.normal);
        addClientInfo.call(this, normalInfo, client.normal);
      }

      return {
        pass: pass ? "P" : "F",
        cssClass: pass ? "pass" : "fail",
        prefetch: {
          info: prefetchInfo.join("<br>"),
          duration: prefetchDuration,
          requested: serverPrefetch.requested ? "Y" : "N",
          responseStatusCode: prefetchResponseStatusCode || "",
          requestHeaders: headersList(serverPrefetch && serverPrefetch.requestHeaders),
          responseHeaders: headersList(serverPrefetch && serverPrefetch.responseHeaders),
          // Did the server actuall reply with CORS header(s)?
          responseCors: (serverPrefetch && serverPrefetch.cors) ? "cors" : "",
        },
        normal: {
          info: normalInfo.join("<br>"),
          duration: normalDuration,
          requested: server.normal.requested ? "Y" : "N",
          responseStatusCode: normalResponseStatusCode || "",
          requestHeaders: headersList(serverNormal && serverNormal.requestHeaders),
          responseHeaders: headersList(serverNormal && serverNormal.responseHeaders),
          // Did the server actuall reply with CORS header(s)?
          responseCors: (serverNormal && serverNormal.cors) ? "cors" : ""
        }
      };
    });

    const firstResult = results[0];
    return {
      row: data.i + 1,
      numTests: data.numTests,
      name: test.name,
      src: getPathWithoutParams(firstResult),
      crossDomain: test.crossDomain ? "xd" : "",
      // test.useCors just means the browser requested CORS.
      useCors: test.useCors ? "cors" : "",
      prefetchNormalPairs: prefetchNormalPairs
    };
  }

  toHTML(view) {
    return Mustache.render(this.tableTemplate, view, {
      result_row: this.rowTemplate,
      result_headers_row: this.headersRowTemplate
    });
  }

  sessionToView(session) {
    return this.sessionsToView(session);
  }

  sessionsToView(session1, session2) {
    const findMatchingTest = (test, session) => {
      for (const k in session.tests) {
        const t = session.tests[k];
        if (t.name === test.name && t.crossDomain === test.crossDomain && t.useCors === test.useCors && t.resource.src === test.resource.src) {
          return t;
        }
      }
      return null;
    };
    const testIds = Object.keys(session1.tests);
    const rows = testIds.map((k, i) => {
      const test1 = session1.tests[k];
      if (test1.state !== "ended") {
        return null;
      }
      const results = {
        i: i,
        numTests: testIds.length,
        test: test1,
        result: [{
          serverResult: test1,
          clientResult: {}
        }]
      };
      if (session2) {
        const test2 = findMatchingTest(test1, session2);
        if (test2) {
          results.result.push({
            serverResult: test2,
            clientResult: {}
          });
        }
      }
      return this.testResultsToRowData(results);
    });
    return {
      date: (typeof session1.timestamp === "number") ? new Date(session1.timestamp).toISOString() : "",
      userAgent: session1.userAgent + (session2 ? " and " + session2.userAgent : ""),
      rows: rows.filter(filterOutFalseys),
      // hack so template can iterate over correct number of columns
      prefetchNormalPairs: Array(session2 ? 2 : 1)
    };
  }
}

ResultsTable.addEventListeners = function(tableElement) {
  var $table = $(tableElement || $("#results-table")[0]);
  $table.on("click", "a[data-type=toggle-headers]", function(evt) {
    evt.preventDefault();
    var row = $(this).attr("data-row");
    var $headersRow = $table.find("tr.headers[data-row=" + row + "]");
    $headersRow.toggleClass("hidden");
  });
};

module.exports = ResultsTable;
