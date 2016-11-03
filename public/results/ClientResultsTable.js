const ResultsTable = require("./ResultsTable");

function updateTable(row) {
  var table = $(this.container).find("table");
  var tbody = $(table).find("tbody")[0];
  $(tbody).append(Mustache.render(this.rowTemplate, row));
  $(tbody).append(Mustache.render(this.headersRowTemplate, row));
}

function onTestComplete(data) {
  var row = this.testResultsToRowData(data);
  this.updateTable(row);
}

function onSessionStarted(session) {
  this.container.append(this.toHTML({
    date: new Date(session.timestamp).toISOString(),
    userAgent: session.userAgent
  }));
  ResultsTable.addEventListeners();
}

ResultsTable.findTemplate = function(template, templateSelector) {
  if (!template) {
    template = $(templateSelector).html();
  }
  return template;
};

// browser impl of escape function
ResultsTable.escapeHtml = (function() {
  var div = $("<div></div>");
  return function(html) {
    return div.text(html).html();
  };
})();

function ClientResultsTable(opts) {
  ResultsTable.apply(this, arguments);
  this.container = $(opts.container);
}

ClientResultsTable.prototype = Object.create(ResultsTable.prototype);
ClientResultsTable.prototype.constructor = ClientResultsTable;

ClientResultsTable.prototype.updateTable = updateTable;
ClientResultsTable.prototype.onSessionStarted = onSessionStarted;
ClientResultsTable.prototype.onTestComplete = onTestComplete;

module.exports = ClientResultsTable;
