function ajax(url, method, data) {
  if (method.toLowerCase() === "post" && typeof data !== "string") {
    data = JSON.stringify(data);
  }
  return new Promise(function(resolve, reject) {
    var opts = {
      url: url,
      method: method,
      data: data,
      contentType: "application/json; charset=utf-8"
    };
    if (data !== null && typeof data !== "undefined") {
      opts.data = data;
    }
    console.log("$.ajax", opts);
    $.ajax(opts).then(resolve, function(jqXHR, textStatus, errorThrown) {
      var e = new Error("$.ajax error. textStatus=" + textStatus + ", url=" + url);
      e.jquery = {
        jqXHR: jqXHR,
        textStatus: textStatus,
        errorThrown: errorThrown
      };
      reject(e);
    });
  });
}

function ajaxer(method) {
  return function(url) {
    return function(data) {
      return ajax(url, method, data);
    };
  };
}

var getter = ajaxer("GET");
var poster = ajaxer("POST");

module.exports = {
  ajaxer: ajaxer,
  getter: getter,
  poster: poster
};
