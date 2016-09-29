/* eslint-env browser, amd */
define(["jquery", "mustache", "./ResultsTable"], function($, Mustache, ResultsTable) {
  function updateTable(row) {
    var table = $(this.container).find("table");
    var tbody = $(table).find("tbody")[0];
    $(tbody).append(Mustache.render(this.rowTemplate, row));
  }

  function onTestComplete(data) {
    var row = this.testResultsToRowData(data);
    this.updateTable(row);
  }

  function appendTo(container, view) {
    this.container = $(container);
    this.container.append(this.toHTML(view));
  }

  ResultsTable.findTemplate = function(template, templateSelector) {
    if (!template) {
      template = $(templateSelector).html();
    }
    return template;
  };

  ResultsTable.escapeHtml = (function() {
    var div = $("<div></div>");
    return function(html) {
      return div.text(html).html();
    };
  })();

  ResultsTable.prototype.updateTable = updateTable;
  ResultsTable.prototype.appendTo = appendTo;
  ResultsTable.prototype.onTestComplete = onTestComplete;

  return ResultsTable;
});
