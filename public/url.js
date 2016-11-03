/* eslint-env browser */
function toQueryString(params) {
  var arr = [];
  for (var k in params) {
    arr.push(k + "=" + encodeURIComponent(params[k]));
  }
  return arr.join("&");
}

function addParams(url, params) {
  var parts = url.split("?");
  var qs = toQueryString(params);
  return url + (parts.length > 1 ? "&" : "?") + qs;
}

// Based on
// http://stackoverflow.com/a/2880929/319878

window.urlParams = null;

function getUrlParams(query) {
  if (typeof query === "undefined") {
    query = window.location.search.substring(1);
  }

  var match,
    pl = /\+/g,  // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function(s) {
      return decodeURIComponent(s.replace(pl, " "));
    };

  var urlParams = {};
  while (match = search.exec(query))
    urlParams[decode(match[1])] = decode(match[2]);
  return urlParams;
}

(window.onpopstate = function() {
  window.urlParams = getUrlParams();
})();

module.exports = {
  toQueryString,
  addParams,
  getUrlParams
};
