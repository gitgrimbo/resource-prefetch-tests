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
    var srcWithoutParams = resource.path.split("?")[0];

    var prefetchRequestStatusCode = server && server.prefetch && server.prefetch.statusCode;
    var normalRequestStatusCode = server && server.normal && server.normal.statusCode;

    var prefetchRequestReceivedByServer = Boolean(prefetchRequestStatusCode);
    var normalRequestReceivedByServer = Boolean(normalRequestStatusCode);
    var pass = Boolean(prefetchRequestReceivedByServer && !normalRequestReceivedByServer);

    var prefetchInfo = [];
    var normalInfo = [];

    if (!prefetchRequestReceivedByServer) {
      prefetchInfo.push("<code>" + srcWithoutParams + "</code>" + " failed to be prefetched");
    } else if (normalRequestReceivedByServer) {
      normalInfo.push("<code>" + srcWithoutParams + "</code>" + " was requested again");
    }
    if (client.prefetch.err) {
      prefetchInfo = prefetchInfo.concat(this.clientErrorToLines(client.prefetch.err));
    }
    if (client.normal.err) {
      normalInfo = normalInfo.concat(this.clientErrorToLines(client.normal.err));
    }

    return {
      i: data.i + 1,
      numTests: data.numTests,
      name: test.name,
      src: srcWithoutParams,
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
