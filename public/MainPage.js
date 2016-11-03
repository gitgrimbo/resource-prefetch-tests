/* eslint-disable no-console */
const tester = require("./tester");
const promiseUtils = require("./promise-utils");
const url = require("./url");
const resources = require("./resources");

function createTestFilter(urlParams) {
  var match = {};
  for (var k in urlParams) {
    var exec = /^test\.(.*)/.exec(k);
    console.log(k, exec);
    if (exec) {
      match[exec[1]] = urlParams[k];
    }
  }
  console.log(match);
  return function(test) {
    for (var k in match) {
      var val = match[k];
      var not = false;
      if (val.charAt(0) === "!") {
        not = true;
        val = val.substring(1);
      }
      // E.g. match[k] could be "true" (string) and test[k] could be true (boolean).
      if (val !== String(test[k])) {
        if (!not) {
          return false;
        }
      } else {
        if (not) {
          return false;
        }
      }
    }
    return true;
  };
}

function MainPage(resources, prefetchContainer, resultsTableElement, resultsTextareaElement, urlParams) {
  this.resources = resources;
  this.prefetchContainer = prefetchContainer;
  this.resultsTableElement = resultsTableElement;
  this.resultsTextareaElement = resultsTextareaElement;
  this.urlParams = urlParams;
  this.testFilter = createTestFilter(urlParams);
}

MainPage.prototype._startTest = function(resultsTable) {
  function onSessionStarted(session) {
    console.log("onStartedStarted", session);
    resultsTable.onSessionStarted(session);
  }

  function onSessionEnded(session) {
    this.resultsTextareaElement.value = JSON.stringify(session, null, 1);
    console.log(session);

    window.resourcePrefetchTestResults = session;
  }

  function onTestComplete(data) {
    console.log("onTestComplete", data);
    resultsTable.onTestComplete(data);
  }

  tester({
    resources: this.resources,
    prefetchContainer: this.prefetchContainer,
    testFilter: this.testFilter,
    listener: {
      onSessionStarted: onSessionStarted.bind(this),
      onSessionEnded: onSessionEnded.bind(this),
      onTestComplete: onTestComplete.bind(this)
    }
  });
};

MainPage.prototype.startTest = function() {
  function getResultsTable() {
    const frame = document.getElementById("results-frame");
    return (frame && frame.contentWindow && frame.contentWindow.resultsTable);
  }
  return promiseUtils.poll(getResultsTable, 100, 1000)
    .then(this._startTest.bind(this))
    .catch(() => {
      alert("results table could not be located");
    });
};

MainPage.bootstrap = function() {
  const prefetchContainer = $("#prefetch-container")[0];
  var frame = $("#results-frame")[0];
  var resultsTableElement = $("#results-table", frame.contentWindow.document)[0];
  var resultsTextareaElement = $("#results")[0];
  const urlParams = url.getUrlParams();
  var app = new MainPage(resources, prefetchContainer, resultsTableElement, resultsTextareaElement, urlParams);
  if (urlParams.autostart === "true") {
    app.startTest();
  }
  $("#start-tests").click(function() {
    app.startTest();
  });
};

module.exports = MainPage;
