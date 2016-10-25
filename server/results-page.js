const fs = require("fs");
const requirejs = require("requirejs");

var dirname = __dirname;

// http://requirejs.org/docs/node.html#nodeModules
requirejs.config({
  baseUrl: __dirname,
  nodeRequire: require
});

const ResultsTable = requirejs("../public/results/ResultsTable");

function filterOutFalseys(it) {
  return Boolean(it);
}

function readTemplate(templateName) {
  return String(fs.readFileSync(dirname + "/../public/results/" + templateName + ".mst.html"));
}

function sessionToView(session, resultsTable) {
  const testIds = Object.keys(session.tests);
  const rows = testIds.map((k, i) => {
    const test = session.tests[k];
    if (test.state !== "ended") {
      return null;
    }
    const results = {
      i: i,
      numTests: testIds.length,
      test: test,
      result: {
        serverResult: test,
        clientResult: {}
      }
    };
    return resultsTable.testResultsToRowData(results);
  });
  return {
    rows: rows.filter(filterOutFalseys)
  };
}

const opts = {
  tableTemplate: readTemplate("table"),
  rowTemplate: readTemplate("row"),
  headersRowTemplate: readTemplate("headers-row"),
  escapeHtml: function(s) {
    return s;
  }
};

module.exports = function(session, stylesUrl) {
  const t = new ResultsTable(opts);
  const view = sessionToView(session, t);

  stylesUrl = stylesUrl || "results/style.css";

  // Why do the weird "ResultsTable.addEventListeners.toString()" thing?
  // Because we aren't actually loading that script in this generated page,
  // so we use toString() to insert the actual function body.
  const top = `<!doctype html>
    <head>
    <link rel="stylesheet" href="${stylesUrl}">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
    <script>window.addEventListener("load", function() {
    (` + ResultsTable.addEventListeners.toString() + `).call();
    }, false);</script>
    </head>
    `;

  return top + t.toHTML(view);
};
