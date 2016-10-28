/* eslint-env browser, amd */
define([
  "./promise-utils"
], function(promiseUtils) {
  function rejectWithEvent(reject, tag, src) {
    return function(event) {
      var attrs = {
        src: src,
        tag: tag,
        event: event
      };
      promiseUtils.rejectWith(reject, tag, attrs)();
    };
  }

  function resolveWith(resolve, msg, attrs) {
    return promiseUtils.resolveWith(resolve, Object.assign({}, attrs, {
      msg: msg
    }));
  }

  function loadResourceByNewImage(opts) {
    var src = opts.src;
    return new Promise(function(resolve, reject) {
      var tag = "loadResourceByNewImage";

      var img = new Image();
      img.addEventListener("load", resolveWith(resolve, tag, {
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

  function loadResourceByImgTag(opts) {
    var src = opts.src;
    var container = opts.container;
    return new Promise(function(resolve, reject) {
      var tag = "loadResourceByImgTag";

      var img = document.createElement("img");
      img.addEventListener("load", resolveWith(resolve, tag, {
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
      obj.addEventListener("load", resolveWith(resolve, tag, {
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
      script.addEventListener("load", resolveWith(resolve, tag, {
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
      xhr.addEventListener("load", resolveWith(resolve, tag, {
        src: src,
        tag: tag
      }));
      xhr.addEventListener("error", rejectWithEvent(reject, tag, src));
      xhr.addEventListener("abort", rejectWithEvent(reject, tag, src));
      xhr.open("GET", src);
      xhr.send();
    });
  }

  function loadResourceByLink(opts) {
    var src = opts.src;
    var container = opts.container;
    var linkAttrs = opts.linkAttrs || {};
    return new Promise(function(resolve, reject) {
      var tag = opts.tag || "loadResourceByLink";

      var link = document.createElement("link");
      link.addEventListener("load", resolveWith(resolve, tag, {
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
            console.log(Date.now(), "resolve");
            clearInterval(timerId);
            var resolver = resolveWith(resolve, tag, {
              src: src,
              tag: tag
            });
            resolver();
          }
        }
        timerId = setInterval(measure, interval);
      }, 10);
    });
  }

  return {
    loadResourceByFontFaceCss: loadResourceByFontFaceCss,
    loadResourceByImgTag: loadResourceByImgTag,
    loadResourceByLink: loadResourceByLink,
    loadResourceByLinkRelPrefetchTag: loadResourceByLinkRelPrefetchTag,
    loadResourceByLinkRelPrefetchTagWithCrossoriginAttr: loadResourceByLinkRelPrefetchTagWithCrossoriginAttr,
    loadResourceByLinkRelStylesheetTag: loadResourceByLinkRelStylesheetTag,
    loadResourceByNewImage: loadResourceByNewImage,
    loadResourceByObjectTag: loadResourceByObjectTag,
    loadResourceByScriptTag: loadResourceByScriptTag,
    loadResourceByXHR: loadResourceByXHR
  };
});
