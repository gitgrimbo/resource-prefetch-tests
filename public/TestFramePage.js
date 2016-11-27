/* eslint-disable no-console */
const resourceLoaders = require("./resource-loaders");

function runInHead(window, resolveData, rejectData) {
  let resolve;
  let reject;
  const promise = new Promise(function(res, rej) {
    resolve = res;
    reject = rej;
  }).timeout(3.5 * 1000);

  function log(...args) {
    args = ["test-frame"].concat(args);
    if (console.log.apply) {
      console.log(...args);
    } else {
      console.log(args.join(","));
    }
  }

  window.resourceOnLoad = function(e) {
    log("resourceOnLoad", resolveData.msg, resolveData.attrs);
    resourceLoaders.resolveWithEvent(resolve, resolveData.msg, resolveData.attrs)(e);
  };

  window.resourceOnError = function(e) {
    log("resourceOnError", rejectData.tag, rejectData.src);
    resourceLoaders.rejectWithEvent(reject, rejectData.tag, rejectData.src)(e);
  };

  window.onmessage = async function(e) {
    log("onmessage", e, e.source.window.location.href, window.location.href);
    if (e.source === window) {
      // IE9 (at least) needs this check.
      return;
    }
    try {
      const value = await promise;
      const message = JSON.stringify({ resolved: value });
      e.source.postMessage(message, e.origin);
    } catch (err) {
      log("err", err);
      const message = JSON.stringify({ rejected: err });
      e.source.postMessage(message, e.origin);
    }
  };

  // Debug code to check the width of the elements affected by the loaded fonts.
  const interval = setInterval((function() {
    let woffSpan;
    let woffWidth;
    let fontStandardSpan;
    let fontStandardWidth;
    let start;
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
      const ww = woffSpan.offsetWidth;
      const fsw = fontStandardSpan.offsetWidth;
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
