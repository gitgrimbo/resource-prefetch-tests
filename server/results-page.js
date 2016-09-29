const fs = require("fs");
const requirejs = require("requirejs");

var dirname = __dirname;

// http://requirejs.org/docs/node.html#nodeModules
requirejs.config({
  baseUrl: __dirname,
  nodeRequire: require
});

const ResultsTable = requirejs("../public/results/ResultsTable");

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
    rows: rows.filter(r => r)
  };
}

const opts = {
  tableTemplate: readTemplate("table"),
  rowTemplate: readTemplate("row"),
  escapeHtml: function(s) {
    return s;
  }
};

module.exports = function(session, stylesUrl) {
  const t = new ResultsTable(opts);
  const view = sessionToView(session, t);

  stylesUrl = stylesUrl || "results/style.css";

  const top = `<!doctype html>\
    <head>\
    <link rel="stylesheet" href="${stylesUrl}">\
    </head>\
    `;

  return top + t.toHTML(view);
};
