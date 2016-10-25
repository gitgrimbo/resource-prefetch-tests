/* eslint-env browser, amd */
define(["./tester"], function(tester) {
  function log() {
    return function(a, b, c) {
      if (typeof console.log === "function") {
        console.log.apply(console, arguments);
      } else {
        console.log(a, b, c);
      }
    };
  }

  function App(resources, prefetchContainer, resultsTableElement, resultsTextareaElement, grep) {
    this.resources = resources;
    this.prefetchContainer = prefetchContainer;
    this.resultsTableElement = resultsTableElement;
    this.resultsTextareaElement = resultsTextareaElement;
    this.grep = grep;
  }

  App.prototype.startTest = function() {
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

    var grep = this.grep;
    tester({
      resources: this.resources,
      prefetchContainer: this.prefetchContainer,
      testFilter: function(test) {
        console.log(grep, test.name);
        return grep ? (test.name.search(grep) > -1) : true;
      },
      listener: {
        onSessionStarted: log(),
        onSessionEnded: onSessionEnded.bind(this),
        onTestComplete: onTestComplete.bind(this)
      }
    });
  };

  return App;
});
