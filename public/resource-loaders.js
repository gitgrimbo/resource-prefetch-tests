/* eslint-env browser, amd */
define(["./promise-utils", "./extend"], function(promiseUtils, extend) {
  function rejectWithEvent(reject, msg, tag, src) {
    return function(event) {
      var attrs = {
        src: src,
        tag: tag,
        event: event
      };
      // Pass msg=null to use this default message.
      msg = (msg === null) ? tag + "[" + src + "]" : msg;
      promiseUtils.rejectWith(reject, msg, attrs)();
    };
  }

  function resolveWith(resolve, msg, tag, src) {
    var attrs = {
      src: src,
      tag: tag
    };
    // Pass msg=null to use this default message.
    msg = (msg === null) ? tag + "[" + src + "]" : msg;
    return promiseUtils.resolveWith(resolve, msg, attrs);
  }

  function loadResourceByNewImage(opts) {
    var src = opts.src;
    return new Promise(function(resolve, reject) {
      var img = new Image();
      var tag = "loadResourceByNewImage";
      img.addEventListener("load", resolveWith(resolve, null, tag, src));
      img.addEventListener("error", rejectWithEvent(reject, null, tag, src));
      img.src = src;
    });
  }

  function loadResourceByImgTag(opts) {
    var src = opts.src;
    var container = opts.container;
    return new Promise(function(resolve, reject) {
      var img = document.createElement("img");
      var tag = "loadResourceByImgTag";
      img.addEventListener("load", resolveWith(resolve, null, tag, src));
      img.addEventListener("error", rejectWithEvent(reject, null, tag, src));
      img.src = src;
      container.appendChild(img);
    });
  }

  function loadResourceByObjectTag(opts) {
    var src = opts.src;
    var container = opts.container;
    return new Promise(function(resolve, reject) {
      var obj = document.createElement("object");
      var tag = "loadResourceByObjectTag";
      obj.addEventListener("load", resolveWith(resolve, null, tag, src));
      obj.addEventListener("error", rejectWithEvent(reject, null, tag, src));
      obj.data = src;
      container.appendChild(obj);
    });
  }

  function loadResourceByScriptTag(opts) {
    var src = opts.src;
    var container = opts.container;
    return new Promise(function(resolve, reject) {
      var script = document.createElement("script");
      var tag = "loadResourceByScriptTag";
      script.addEventListener("load", resolveWith(resolve, null, tag, src));
      script.addEventListener("error", rejectWithEvent(reject, null, tag, src));
      script.src = src;
      container.appendChild(script);
    });
  }

  function loadResourceByXHR(opts) {
    var src = opts.src;
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      var tag = "loadResourceByXHR";
      xhr.addEventListener("load", resolveWith(resolve, null, tag, src));
      xhr.addEventListener("error", rejectWithEvent(reject, null, tag, src));
      xhr.addEventListener("abort", rejectWithEvent(reject, null, tag, src));
      xhr.open("GET", src);
      xhr.send();
    });
  }

  function loadResourceByLink(opts) {
    var src = opts.src;
    var container = opts.container;
    var linkAttrs = opts.linkAttrs || {};
    return new Promise(function(resolve, reject) {
      var link = document.createElement("link");
      var tag = "loadResourceByLink";
      link.addEventListener("load", resolveWith(resolve, null, tag, src));
      link.addEventListener("error", rejectWithEvent(reject, null, tag, src));
      link.setAttribute("href", src);
      for (var k in linkAttrs) {
        link.setAttribute(k, linkAttrs[k]);
      }
      container = document.getElementsByTagName("head")[0];
      container.appendChild(link);
    });
  }

  function loadResourceByLinkRelStylesheetTag(opts) {
    return loadResourceByLink(extend({}, opts, {
      linkAttrs: {
        rel: "stylesheet",
        type: "text/css"
      }
    }));
  }

  function loadResourceByLinkRelPrefetchTag(opts) {
    return loadResourceByLink(extend({}, opts, {
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
            var resolver = resolveWith(resolve, null, tag, src);
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
    loadResourceByLinkRelStylesheetTag: loadResourceByLinkRelStylesheetTag,
    loadResourceByNewImage: loadResourceByNewImage,
    loadResourceByObjectTag: loadResourceByObjectTag,
    loadResourceByScriptTag: loadResourceByScriptTag,
    loadResourceByXHR: loadResourceByXHR
  };
});