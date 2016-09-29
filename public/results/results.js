/* eslint-env browser, amd */
define(["jquery", "./ClientResultsTable"], function($, ResultsTable) {
  function loadTemplates() {
    return Promise.all([
      $.get("./table.mst.html"),
      $.get("./row.mst.html")
    ]).then(function(templates) {
      return {
        tableTemplate: templates[0],
        rowTemplate: templates[1]
      };
    });
  }

  function init(container) {
    loadTemplates().then(function(templates) {
      var t = new ResultsTable({
        tableTemplate: templates.tableTemplate,
        rowTemplate: templates.rowTemplate,
        escapeHtml: ResultsTable.escapeHtml
      });
      t.appendTo(container, {});
      window.resultsTable = t;
    });
  }

  init("#content");
});
