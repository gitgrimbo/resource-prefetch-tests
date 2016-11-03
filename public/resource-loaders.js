import promiseUtils from "./promise-utils";

/**
 * Make a basic, shallow copy of the event; the copy can be serialised.
 * @param {object} event The source event.
 * @return {object} The copy.
 */
function copyEvent(event) {
  if (!event) {
    return null;
  }
  var target = null;
  if (event.target.tagName) {
    target = event.target.tagName;
  } else if (event.target instanceof XMLHttpRequest) {
    target = "XMLHttpRequest";
  } else {
    target = typeof event.target;
  }
  return {
    type: event.type,
    timeStamp: event.timeStamp,
    target: target
  };
}

function rejectWithEvent(reject, tag, src) {
  var start = Date.now();
  return function(event) {
    var attrs = {
      src: src,
      tag: tag,
      // make simple copy so we can pass some attributes between frames
      // and also for serialisation to server
      event: copyEvent(event),
      duration: Date.now() - start
    };
    return promiseUtils.rejectWith(reject, tag, attrs)();
  };
}

function resolveWith(resolve, msg, attrs) {
  var start = Date.now();
  return function(extraAttrs) {
    return promiseUtils.resolveWith(resolve, Object.assign({}, attrs, extraAttrs, {
      msg: msg,
      duration: Date.now() - start
    }))();
  };
}

function resolveWithEvent(resolve, msg, attrs) {
  var start = Date.now();
  return function(event) {
    attrs = Object.assign({}, attrs, {
      msg: msg,
      // make simple copy so we can pass some attributes between frames
      // and also for serialisation to server
      event: copyEvent(event),
      duration: Date.now() - start
    });
    return promiseUtils.resolveWith(resolve, attrs)();
  };
}

function loadResourceByNewImage(opts) {
  var src = opts.src;
  return new Promise(function(resolve, reject) {
    var tag = "loadResourceByNewImage";

    var img = new Image();
    img.addEventListener("load", resolveWithEvent(resolve, tag, {
      src: src,
      tag: tag,
      crossorigin: opts.crossorigin
    }));
    img.addEventListener("error", rejectWithEvent(reject, tag, src));

    if (opts.crossorigin) {
      // https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
      img.crossOrigin = "anonymous";
    }

    img.src = src;
  });
}

var imgTagCount = 0;
function loadResourceByImgTag(opts) {
  var src = opts.src;
  var container = opts.container;
  return new Promise(function(resolve, reject) {
    var tag = "loadResourceByImgTag";

    var onload = resolveWithEvent(resolve, tag, {
      src: src,
      tag: tag,
      crossorigin: opts.crossorigin
    });
    var onerror = rejectWithEvent(reject, tag, src);

    imgTagCount++;
    var onloadname = "loadResourceByImgTag_load_" + imgTagCount;
    var onerrorname = "loadResourceByImgTag_error_" + imgTagCount;
    window[onloadname] = onload;
    window[onerrorname] = onerror;

    var crossoriginAttr = opts.crossorigin ? " crossorigin=anonymous" : "";

    var img = "<img" + crossoriginAttr + " onload='" + onloadname + "(event)' onerror='" + onerrorname + "(event)' src='" + src + "'>";
    container.innerHTML = img;
  });
}

function loadResourceByImgElement(opts) {
  var src = opts.src;
  var container = opts.container;
  return new Promise(function(resolve, reject) {
    var tag = "loadResourceByImgElement";

    var img = document.createElement("img");
    img.addEventListener("load", resolveWithEvent(resolve, tag, {
      src: src,
      tag: tag,
      crossorigin: opts.crossorigin
    }));
    img.addEventListener("error", rejectWithEvent(reject, tag, src));

    if (opts.crossorigin) {
      // https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
      img.setAttribute("crossorigin", "anonymous");
    }

    img.src = src;
    container.appendChild(img);
  });
}

function loadResourceByObjectTag(opts) {
  var src = opts.src;
  var container = opts.container;
  return new Promise(function(resolve, reject) {
    var tag = "loadResourceByObjectTag";

    var obj = document.createElement("object");
    obj.addEventListener("load", resolveWithEvent(resolve, tag, {
      src: src,
      tag: tag,
      // <object> does not support "crossorigin" attr
    }));
    obj.addEventListener("error", rejectWithEvent(reject, tag, src));

    obj.data = src;
    container.appendChild(obj);
  });
}

function loadResourceByScriptTag(opts) {
  var src = opts.src;
  var container = opts.container;
  return new Promise(function(resolve, reject) {
    var tag = "loadResourceByScriptTag";

    var script = document.createElement("script");
    script.addEventListener("load", resolveWithEvent(resolve, tag, {
      src: src,
      tag: tag,
      crossorigin: opts.crossorigin
    }));
    script.addEventListener("error", rejectWithEvent(reject, tag, src));

    if (opts.crossorigin) {
      // https://developer.mozilla.org/en/docs/Web/HTML/Element/script#attr-crossorigin
      script.setAttribute("crossorigin", "anonymous");
    }

    script.src = src;
    container.appendChild(script);
  });
}

function loadResourceByXHR(opts) {
  var src = opts.src;
  return new Promise(function(resolve, reject) {
    var tag = "loadResourceByXHR";

    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", resolveWithEvent(resolve, tag, {
      src: src,
      tag: tag
    }));
    xhr.addEventListener("error", rejectWithEvent(reject, tag, src));
    xhr.addEventListener("abort", rejectWithEvent(reject, tag, src));
    xhr.open("GET", src);
    xhr.send();
  });
}

function loadResourceByXDomainRequest(opts) {
  var src = opts.src;
  var tag = "loadResourceByXDomainRequest";

  if (!window.XDomainRequest) {
    return new Promise(function(resolve, reject) {
      var err = new Error("XDomainRequest not supported");
      err.tag = tag;
      err.src = src;
      err.duration = 0;
      reject(err);
    });
  }

  return new Promise(function(resolve, reject) {
    var xdr = new XDomainRequest();

    xdr.open("get", src);

    xdr.ontimeout = rejectWithEvent(reject, tag, src);
    xdr.onerror = rejectWithEvent(reject, tag, src);
    xdr.onload = resolveWithEvent(resolve, tag, {
      src: src,
      tag: tag
    });

    // https://developer.mozilla.org/en-US/docs/Web/API/XDomainRequest#Example
    // Note: The xdr.send() call is wrapped in a timeout to prevent an
    // issue with the interface where some requests are lost if multiple
    // XDomainRequests are being sent at the same time.
    setTimeout(function() {
      xdr.send();
    }, 0);
  });
}

function loadResourceByLink(opts) {
  var src = opts.src;
  var container = opts.container;
  var linkAttrs = opts.linkAttrs || {};
  return new Promise(function(resolve, reject) {
    var tag = opts.tag || "loadResourceByLink";

    var link = document.createElement("link");
    link.addEventListener("load", resolveWithEvent(resolve, tag, {
      src: src,
      tag: tag,
      crossorigin: opts.crossorigin
    }));
    link.addEventListener("error", rejectWithEvent(reject, tag, src));

    if (opts.crossorigin) {
      // https://developer.mozilla.org/en/docs/Web/HTML/Element/link#attr-crossorigin
      link.setAttribute("crossorigin", "anonymous");
    }

    for (var k in linkAttrs) {
      link.setAttribute(k, linkAttrs[k]);
    }
    link.setAttribute("href", src);

    container = document.getElementsByTagName("head")[0];
    container.appendChild(link);
  });
}

function loadResourceByLinkRelStylesheetTag(opts) {
  return loadResourceByLink(Object.assign({}, opts, {
    tag: "loadResourceByLinkRelStylesheetTag",
    linkAttrs: {
      rel: "stylesheet",
      type: "text/css"
    }
  }));
}

function loadResourceByLinkRelPrefetchTag(opts) {
  return loadResourceByLink(Object.assign({}, opts, {
    tag: "loadResourceByLinkRelPrefetchTag",
    linkAttrs: {
      rel: "prefetch"
    }
  }));
}

function loadResourceByLinkRelPrefetchTagWithCrossoriginAttr(opts) {
  return loadResourceByLink(Object.assign({}, opts, {
    tag: "loadResourceByLinkRelPrefetchTagWithCrossoriginAttr",
    crossorigin: true,
    linkAttrs: {
      rel: "prefetch"
    }
  }));
}

function loadResourceByFontFaceCss(opts) {
  var src = opts.src;
  var container = opts.container;
  var css = "\
    @font-face {\
      font-family: 'Pacifico';\
      font-style: normal;\
      font-weight: 400;\
      src: local('Pacifico Regular'), local('Pacifico-Regular'), url('" + src + "') format('woff');\
    }\
    ";
  return new Promise(function(resolve, reject) {
    var tag = "loadResourceByFontFaceCss";

    // Create resolver outside timeout to capture correct duration
    var resolver = resolveWith(resolve, tag, {
      src: src,
      tag: tag
    });

    var style = document.createElement("style");
    style.innerHTML = css;
    container.appendChild(style);

    var div = document.createElement("div");
    var id = Date.now() + "-" + Math.random();
    div.innerHTML = "<span id='" + id + "' style='font-family:Arial'>WWWWW</span>";
    container.appendChild(div);

    // small timeout to 'load' Arial font and get text size.
    setTimeout(function() {
      var el = document.getElementById(id);
      var oldWidth = el.offsetWidth;
      el.style.fontFamily = "Pacifico";
      var count = 100;
      var interval = 100;
      var timerId;
      function measure() {
        if (count-- <= 0) clearInterval(timerId);
        var newWidth = el.offsetWidth;
        if (newWidth !== oldWidth) {
          clearInterval(timerId);
          resolver({
            count,
            newWidth,
            oldWidth
          });
        }
      }
      timerId = setInterval(measure, interval);
    }, 10);
  });
}

export default {
  loadResourceByFontFaceCss: loadResourceByFontFaceCss,
  loadResourceByImgElement: loadResourceByImgElement,
  loadResourceByImgTag: loadResourceByImgTag,
  loadResourceByLink: loadResourceByLink,
  loadResourceByLinkRelPrefetchTag: loadResourceByLinkRelPrefetchTag,
  loadResourceByLinkRelPrefetchTagWithCrossoriginAttr: loadResourceByLinkRelPrefetchTagWithCrossoriginAttr,
  loadResourceByLinkRelStylesheetTag: loadResourceByLinkRelStylesheetTag,
  loadResourceByNewImage: loadResourceByNewImage,
  loadResourceByObjectTag: loadResourceByObjectTag,
  loadResourceByScriptTag: loadResourceByScriptTag,
  loadResourceByXDomainRequest: loadResourceByXDomainRequest,
  loadResourceByXHR: loadResourceByXHR
};
