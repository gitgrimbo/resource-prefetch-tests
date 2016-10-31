/* eslint-env browser, amd */
define(["jquery", "./ClientResultsTable"], function($, ResultsTable) {
  function loadTemplates(templates) {
    var keys = Object.keys(templates);
    var gets = keys.map(function(key) {
      return $.get(templates[key]);
    });
    return Promise.all(gets)
      .then(function(responses) {
        return responses.reduce(function(templates, r, i) {
          // set the template to the appropriate key
          templates[keys[i]] = r;
          return templates;
        }, {});
      });
  }

  function init(container) {
    var templatePaths = {
      tableTemplate: "./table.mst.html",
      rowTemplate: "./row.mst.html",
      headersRowTemplate: "./headers-row.mst.html"
    };
    loadTemplates(templatePaths).then(function(templates) {
      var t = new ResultsTable({
        container: container,
        tableTemplate: templates.tableTemplate,
        rowTemplate: templates.rowTemplate,
        headersRowTemplate: templates.headersRowTemplate,
        escapeHtml: ResultsTable.escapeHtml
      });
      window.resultsTable = t;
    });
  }

  init("#content");
});
