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

  function App(resources, prefetchContainer, resultsTableElement, resultsTextareaElement) {
    this.resources = resources;
    this.prefetchContainer = prefetchContainer;
    this.resultsTableElement = resultsTableElement;
    this.resultsTextareaElement = resultsTextareaElement;
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

    tester(this.resources, this.prefetchContainer, {
      onSessionStarted: log(),
      onSessionEnded: onSessionEnded.bind(this),
      onTestComplete: onTestComplete.bind(this)
    });
  };

  return App;
});
