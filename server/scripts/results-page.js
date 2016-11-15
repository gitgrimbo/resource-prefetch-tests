const fs = require("fs");
const ResultsTable = require("../../public/results/ResultsTable");

const dirname = __dirname;

function readTemplate(templateName) {
  return String(fs.readFileSync(dirname + "/../../public/results/" + templateName + ".mst.html"));
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
  const view = t.sessionToView(session);

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
