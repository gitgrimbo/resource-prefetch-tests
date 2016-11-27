const ResultsTable = require("./ResultsTable");
const ClientResultsTable = require("./ClientResultsTable");
const resultsComparator = require("../diff/results-comparator");
const url = require("../url");
const compare = resultsComparator.compare;

async function loadTemplates(templates) {
  const keys = Object.keys(templates);
  const gets = keys.map((key) => $.get(templates[key]));
  const responses = Promise.all(gets);
  return responses.reduce(function(templates, r, i) {
    // set the template to the appropriate key
    templates[keys[i]] = r;
    return templates;
  }, {});
}

function validateUrls(url1, url2) {
  if (!url1 || !url2 || typeof url1 !== "string" || typeof url2 !== "string") {
    throw new Error(`url1=${url1} and url2=${url2} must be valid strings`);
  }
}

function ResultsPage() { }

ResultsPage.bootstrapResultsMode = async function(container) {
  container = container || "#content";

  const templatePaths = {
    tableTemplate: "./table.mst.html",
    rowTemplate: "./row.mst.html",
    headersRowTemplate: "./headers-row.mst.html"
  };

  const templates = await loadTemplates(templatePaths);
  const t = new ClientResultsTable({
    container: container,
    tableTemplate: templates.tableTemplate,
    rowTemplate: templates.rowTemplate,
    headersRowTemplate: templates.headersRowTemplate,
    escapeHtml: ResultsTable.escapeHtml
  });
  window.resultsTable = t;
  return t;
};

ResultsPage.bootstrapDiffMode = async function() {
  const params = url.getUrlParams();
  validateUrls(params.url1, params.url2);
  const resultsTable = await ResultsPage.bootstrapResultsMode();
  const results = await Promise.all([$.get(params.url1), $.get(params.url2)]);
  const [session1, session2] = results;
  const view = resultsTable.sessionsToView(session1, session2);
  const html = resultsTable.toHTML(view);
  $(resultsTable.container).html(html);
  //return compare(results[0], results[1]);
};

ResultsPage.bootstrap = function() {
  const params = url.getUrlParams();
  if (params.mode === "diff") {
    return ResultsPage.bootstrapDiffMode();
  }
  return ResultsPage.bootstrapResultsMode();
};

module.exports = ResultsPage;
