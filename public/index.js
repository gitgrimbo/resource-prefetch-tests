const url = require("./url");
const App = require("./App");
const resources = require("./resources");

const prefetchContainer = $("#prefetch-container")[0];
var frame = $("#results-frame")[0];
var resultsTableElement = $("#results-table", frame.contentWindow.document)[0];
var resultsTextareaElement = $("#results")[0];
const urlParams = url.getUrlParams();
var app = new App(resources, prefetchContainer, resultsTableElement, resultsTextareaElement, urlParams);
if (urlParams.autostart === "true") {
  app.startTest();
}
$("#start-tests").click(function() {
  app.startTest();
});
