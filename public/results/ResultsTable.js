/* eslint-env browser, amd */
define(["jquery", "mustache"], function($, Mustache) {
  function clientErrorToLines(err) {
    var lines = [];
    if (err.name === "TimeoutError") {
      lines.push("Client timeout waiting for load/error event");
    } else if (err.event) {
      var event = err.event;
      var msg = '"' + event.type + "' event fired.";
      if (event.target && event.target.tagName) {
        msg += " On tag " + event.target.tagName;
      }
      lines.push(msg);
    } else if (err.name) {
      lines.push(err.name + ": " + err.message);
    } else {
      lines.push("onError: " + this.escapeHtml(err));
    }
    return lines;
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

  function testResultsToRowData(data) {
    var test = data.test;
    var resource = data.result.serverResult.resource;
    var client = resource.client;
    var server = resource.server;

    // If server.path does not exist, it means neither a prefetch
    // nor a normal request made it to the server.
    // In that case use resource.src, which is the URL used to make
    // (or rather not make) the request.
    var pathWithoutParams = (server && server.path) ? server.path.split("?")[0] : resource.src;

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
      prefetchInfo.push("<code>" + pathWithoutParams + "</code>" + " failed to be prefetched");
    } else if (normalRequestReceivedByServer) {
      normalInfo.push("<code>" + pathWithoutParams + "</code>" + " was requested again");
    }

    if (client && client.prefetch) {
      if (client.prefetch.err) {
        prefetchInfo = prefetchInfo.concat(this.clientErrorToLines(client.prefetch.err));
      } else if (client.prefetch.data) {
        prefetchInfo = prefetchInfo.concat('"load" event fired.');
      }
    }
    if (client && client.normal) {
      if (client.normal.err) {
        normalInfo = normalInfo.concat(this.clientErrorToLines(client.normal.err));
      } else if (client.normal.data) {
        normalInfo = normalInfo.concat('"load" event fired.');
      }
    }

    return {
      row: data.i + 1,
      numTests: data.numTests,
      name: test.name,
      src: pathWithoutParams,
      crossDomain: test.crossDomain ? "xd" : "",
      // test.useCors just means the browser requested CORS.
      useCors: test.useCors ? "cors" : "",
      pass: pass ? "P" : "F",
      cssClass: pass ? "pass" : "fail",

      prefetchInfo: prefetchInfo.join("<br>"),
      prefetchRequested: serverPrefetch.requested ? "Y" : "N",
      prefetchResponseStatusCode: prefetchResponseStatusCode || "",
      prefetchRequestHeaders: headersList(serverPrefetch && serverPrefetch.requestHeaders),
      prefetchResponseHeaders: headersList(serverPrefetch && serverPrefetch.responseHeaders),
      // Did the server actuall reply with CORS header(s)?
      prefetchResponseCors: (serverPrefetch && serverPrefetch.cors) ? "cors" : "",

      normalInfo: normalInfo.join("<br>"),
      normalRequested: server.normal.requested ? "Y" : "N",
      normalResponseStatusCode: normalResponseStatusCode || "",
      normalRequestHeaders: headersList(serverNormal && serverNormal.requestHeaders),
      normalResponseHeaders: headersList(serverNormal && serverNormal.responseHeaders),
      // Did the server actuall reply with CORS header(s)?
      normalResponseCors: (serverNormal && serverNormal.cors) ? "cors" : ""
    };
  }

  function toHTML(view) {
    return Mustache.render(this.tableTemplate, view, {
      result_row: this.rowTemplate,
      result_headers_row: this.headersRowTemplate
    });
  }

  function ResultsTable(opts) {
    opts = opts || {};
    this.tableTemplate = opts.tableTemplate;
    this.rowTemplate = opts.rowTemplate;
    this.headersRowTemplate = opts.headersRowTemplate;
    this.escapeHtml = opts.escapeHtml;
    Mustache.parse(opts.tableTemplate);
    Mustache.parse(opts.rowTemplate);
    Mustache.parse(opts.headersRowTemplate);
  }

  ResultsTable.prototype = {
    clientErrorToLines: clientErrorToLines,
    toHTML: toHTML,
    testResultsToRowData: testResultsToRowData
  };

  ResultsTable.addEventListeners = function(tableElement) {
    var $table = $(tableElement || $("#results-table")[0]);
    $table.on("click", "a[data-type=toggle-headers]", function(evt) {
      evt.preventDefault();
      var row = $(this).attr("data-row");
      var $headersRow = $table.find("tr.headers[data-row=" + row + "]");
      $headersRow.toggleClass("hidden");
    });
  };

  return ResultsTable;
});
