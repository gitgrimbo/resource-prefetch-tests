/* eslint-env browser, amd */
/* eslint-disable no-console */
import tester from "./tester";

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

function App(resources, prefetchContainer, resultsTableElement, resultsTextareaElement, urlParams) {
  this.resources = resources;
  this.prefetchContainer = prefetchContainer;
  this.resultsTableElement = resultsTableElement;
  this.resultsTextareaElement = resultsTextareaElement;
  this.urlParams = urlParams;
  this.testFilter = createTestFilter(urlParams);
}

App.prototype.startTest = function() {
  function onSessionStarted(session) {
    console.log("onStartedStarted", session);
    var resultsWindow = document.getElementById("results-frame").contentWindow;
    resultsWindow.resultsTable.onSessionStarted(session);
  }

  function onSessionEnded(session) {
    this.resultsTextareaElement.value = JSON.stringify(session, null, 1);
    console.log(session);

    window.resourcePrefetchTestResults = session;
  }

  function onTestComplete(data) {
    console.log("onTestComplete", data);
    var resultsWindow = document.getElementById("results-frame").contentWindow;
    resultsWindow.resultsTable.onTestComplete(data);
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

export default App;
