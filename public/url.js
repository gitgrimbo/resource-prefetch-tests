/* eslint-env browser, amd */
define([], function() {
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

  return {
    toQueryString: toQueryString,
    addParams: addParams
  };
});
