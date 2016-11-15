const $ = require("jquery");
const ResultsTable = require("./ClientResultsTable");
const resultsComparator = require("../diff/results-comparator");
const url = require("../url");
const compare = resultsComparator.compare;

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

function validateUrls(url1, url2) {
  if (!url1 || !url2 || typeof url1 !== "string" || typeof url2 !== "string") {
    throw new Error("url1=" + url1 + " and url2=" + url2 + " must be valid strings");
  }
}

function ResultsPage() { }

ResultsPage.bootstrapResultsMode = function(container) {
  container = container || "#content";

  var templatePaths = {
    tableTemplate: "./table.mst.html",
    rowTemplate: "./row.mst.html",
    headersRowTemplate: "./headers-row.mst.html"
  };

  return loadTemplates(templatePaths).then(function(templates) {
    var t = new ResultsTable({
      container: container,
      tableTemplate: templates.tableTemplate,
      rowTemplate: templates.rowTemplate,
      headersRowTemplate: templates.headersRowTemplate,
      escapeHtml: ResultsTable.escapeHtml
    });
    window.resultsTable = t;
    return t;
  });
};

ResultsPage.bootstrapDiffMode = function() {
  const params = url.getUrlParams();
  validateUrls(params.url1, params.url2);
  return ResultsPage.bootstrapResultsMode()
    .then((resultsTable) => {
      return Promise.all([$.get(params.url1), $.get(params.url2)])
        .then(function(results) {
          const [session1, session2] = results;
          const view = resultsTable.sessionsToView(session1, session2);
          const html = resultsTable.toHTML(view);
          $(resultsTable.container).html(html);
          //return compare(results[0], results[1]);
        });
    });
};

ResultsPage.bootstrap = function() {
  const params = url.getUrlParams();
  if (params.mode === "diff") {
    return ResultsPage.bootstrapDiffMode();
  }
  return ResultsPage.bootstrapResultsMode();
};

module.exports = ResultsPage;
