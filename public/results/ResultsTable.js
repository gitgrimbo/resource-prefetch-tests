/* eslint-env browser, amd */
define(["mustache"], function(Mustache) {
  function clientErrorToLines(err) {
    var lines = [];
    if (err.name === "TimeoutError") {
      lines.push("Client timeout waiting for load/error event");
    } else if (err.event) {
      var event = err.event;
      var msg = '"' + event.type + "' event raised.";
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

    var prefetchRequestStatusCode = server && server.prefetch && server.prefetch.statusCode;
    var normalRequestStatusCode = server && server.normal && server.normal.statusCode;

    var prefetchRequestReceivedByServer = Boolean(prefetchRequestStatusCode);
    var normalRequestReceivedByServer = Boolean(normalRequestStatusCode);
    var pass = Boolean(prefetchRequestReceivedByServer && !normalRequestReceivedByServer);

    var prefetchInfo = [];
    var normalInfo = [];

    if (!prefetchRequestReceivedByServer) {
      prefetchInfo.push("<code>" + pathWithoutParams + "</code>" + " failed to be prefetched");
    } else if (normalRequestReceivedByServer) {
      normalInfo.push("<code>" + pathWithoutParams + "</code>" + " was requested again");
    }
    if (client && client.prefetch && client.prefetch.err) {
      prefetchInfo = prefetchInfo.concat(this.clientErrorToLines(client.prefetch.err));
    }
    if (client && client.normal && client.normal.err) {
      normalInfo = normalInfo.concat(this.clientErrorToLines(client.normal.err));
    }

    return {
      i: data.i + 1,
      numTests: data.numTests,
      name: test.name,
      src: pathWithoutParams,
      crossDomain: test.crossDomain ? "xd" : "",
      useCors: test.useCors ? "cors" : "",
      pass: pass ? "P" : "F",
      cssClass: pass ? "pass" : "fail",
      prefetchInfo: prefetchInfo.join("<br>"),
      prefetchRequested: server.prefetch.requested ? "Y" : "N",
      prefetchRequestStatusCode: prefetchRequestStatusCode || "",
      normalInfo: normalInfo.join("<br>"),
      normalRequested: server.normal.requested ? "Y" : "N",
      normalRequestStatusCode: normalRequestStatusCode || ""
    };
  }

  function toHTML(view) {
    return Mustache.render(this.tableTemplate, view, {
      result_row: this.rowTemplate
    });
  }

  function ResultsTable(opts) {
    opts = opts || {};
    this.tableTemplate = opts.tableTemplate;
    this.rowTemplate = opts.rowTemplate;
    this.escapeHtml = opts.escapeHtml;
    Mustache.parse(opts.tableTemplate);
    Mustache.parse(opts.rowTemplate);
  }

  ResultsTable.prototype = {
    clientErrorToLines: clientErrorToLines,
    toHTML: toHTML,
    testResultsToRowData: testResultsToRowData
  };

  return ResultsTable;
});
