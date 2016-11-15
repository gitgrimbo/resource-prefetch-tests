const $ = require("jquery");
const ResultsTable = require("./ResultsTable");

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

class ClientResultsTable extends ResultsTable {
  constructor(opts) {
    super(opts);
    this.container = $(opts.container);
  }

  updateTable(row) {
    var table = $(this.container).find("table");
    var tbody = $(table).find("tbody")[0];
    $(tbody).append(Mustache.render(this.rowTemplate, row));
    $(tbody).append(Mustache.render(this.headersRowTemplate, row));
  }

  onTestComplete(data) {
    var row = this.testResultsToRowData(data);
    this.updateTable(row);
  }

  onSessionStarted(session) {
    this.container.append(this.toHTML({
      date: new Date(session.timestamp).toISOString(),
      userAgent: session.userAgent,
      // hack so template can iterate over one item
      prefetchNormalPairs: [,]
    }));
    ResultsTable.addEventListeners();
  }
}

module.exports = ClientResultsTable;
