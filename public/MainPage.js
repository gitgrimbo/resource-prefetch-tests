/* eslint-disable no-console */
const tester = require("./tester");
const promiseUtils = require("./promise-utils");
const url = require("./url");
const resources = require("./resources");

function createTestFilter(urlParams) {
  const match = {};
  for (const k in urlParams) {
    const exec = /^test\.(.*)/.exec(k);
    console.log(k, exec);
    if (exec) {
      match[exec[1]] = urlParams[k];
    }
  }
  console.log(match);
  return function(test) {
    for (const k in match) {
      let val = match[k];
      let not = false;
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

MainPage.prototype.startTest = async function() {
  function getResultsTable() {
    const frame = document.getElementById("results-frame");
    return (frame && frame.contentWindow && frame.contentWindow.resultsTable);
  }
  try {
    const resultsTable = await promiseUtils.poll(getResultsTable, 100, 1000);
    this._startTest(resultsTable);
  } catch(err) {
    alert("results table could not be located");
  }
};

MainPage.bootstrap = function() {
  const prefetchContainer = $("#prefetch-container")[0];
  const frame = $("#results-frame")[0];
  const resultsTableElement = $("#results-table", frame.contentWindow.document)[0];
  const resultsTextareaElement = $("#results")[0];
  const urlParams = url.getUrlParams();
  const app = new MainPage(resources, prefetchContainer, resultsTableElement, resultsTextareaElement, urlParams);
  if (urlParams.autostart === "true") {
    app.startTest();
  }
  $("#start-tests").click(function() {
    app.startTest();
  });
};

module.exports = MainPage;
