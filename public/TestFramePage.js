const resourceLoaders = require("./resource-loaders");

function runInHead(window) {
  var resolve;
  var reject;
  var promise = new Promise(function(res, rej) {
    resolve = res;
    reject = rej;
  }).timeout(3.5 * 1000);

  function log() {
    var args = [].slice.call(arguments);
    args = ["test-frame"].concat(args);
    if (console.log.apply) {
      console.log.apply(console, args);
    } else {
      console.log(args.join(","));
    }
  }

  window.resourceOnLoad = function(e) {
    log("resourceOnLoad", e);
    const msg = "?";
    const attrs = {};
    resourceLoaders.resolveWithEvent(resolve, msg, attrs)(e);
  };

  window.resourceOnError = function(e) {
    log("resourceOnError", e);
    const tag = "?";
    const src = "?";
    resourceLoaders.rejectWithEvent(reject, tag, src)(e);
  };

  window.onmessage = function(e) {
    log("onmessage", e);
    promise
      .then(function(value) {
        var message = JSON.stringify({ resolved: value });
        e.source.postMessage(message, e.origin);
      })
      .catch(function(err) {
        log("err", err);
        var message = JSON.stringify({ rejected: err });
        e.source.postMessage(message, e.origin);
      });
  };

  var interval = setInterval((function() {
    var woffSpan;
    var woffWidth;
    var fontStandardSpan;
    var fontStandardWidth;
    var start;
    return function() {
      if (!woffSpan) {
        woffSpan = document.querySelector("#woff-span");
        fontStandardSpan = document.querySelector("#standard-font-span");
      }
      if (!woffSpan) {
        return;
      }
      if (!start) {
        start = Date.now();
      }
      var ww = woffSpan.offsetWidth;
      var fsw = fontStandardSpan.offsetWidth;
      log("woffWidth", ww, woffWidth);
      log("fontStandardWidth", fsw, fontStandardWidth);
      woffWidth = ww;
      fontStandardWidth = fsw;
      if (woffWidth !== fontStandardWidth) {
        log("duration", Date.now() - start);
        clearInterval(interval);
      }
    };
  } ()), 10);
}

module.exports = {
  runInHead
};
