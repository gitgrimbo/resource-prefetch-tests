const promiseUtils = require("./promise-utils");
const resourceLoaders = require("./resource-loaders");

var timeoutify = promiseUtils.timeoutify;

var container = document.getElementById("prefetch-container") || document.body;

function setContainer(container_) {
  container = container_;
}

function clearContainer() {
  $(container).empty();
}

function timeoutifyLoader(loaderName) {
  return timeoutify(resourceLoaders[loaderName], loaderName);
}

var loadResourceByFontFaceCss = timeoutifyLoader("loadResourceByFontFaceCss");
var loadResourceByNewImage = timeoutifyLoader("loadResourceByNewImage");
var loadResourceByImgTag = timeoutifyLoader("loadResourceByImgTag");
var loadResourceByObjectTag = timeoutifyLoader("loadResourceByObjectTag");
var loadResourceByScriptTag = timeoutifyLoader("loadResourceByScriptTag");
var loadResourceByScriptTagWithBogusType = timeoutifyLoader("loadResourceByScriptTagWithBogusType");
var loadResourceByXHR = timeoutifyLoader("loadResourceByXHR");
var loadResourceByXDomainRequest = timeoutifyLoader("loadResourceByXDomainRequest");
var loadResourceByLinkRelStylesheetTag = timeoutifyLoader("loadResourceByLinkRelStylesheetTag");
var loadResourceByLinkRelStylesheetTagWithBogusMedia = timeoutifyLoader("loadResourceByLinkRelStylesheetTagWithBogusMedia");
var loadResourceByLinkRelPrefetchTag = timeoutifyLoader("loadResourceByLinkRelPrefetchTag");
var loadResourceByLinkRelPrefetchTagWithCrossoriginAttr = timeoutifyLoader("loadResourceByLinkRelPrefetchTagWithCrossoriginAttr");

function loadResourceIntoIframe(resource, timeout) {
  function getType(resourceType) {
    if (resourceType === "img") {
      return "imgTag";
    } else if (resourceType === "script") {
      return "scriptTag";
    } else if (resourceType === "css") {
      return "cssLink";
    } else if (resourceType === "font") {
      return "woffStyle";
    }
    return null;
  }
  const iframe = document.getElementById("test-frame");
  const type = getType(resource.type);
  const resourceSrc = encodeURIComponent(resource.src);
  const iframeSrc = `/test-frame.html?src=${resourceSrc}&type=${type}`;
  console.log("iframeSrc", iframeSrc);
  return new Promise((resolve, reject) => {
    iframe.onload = function() {
      iframe.onload = null;
      window.onmessage = function(e) {
        const data = JSON.parse(e.data);
        console.log("parent", "onmessage", e, data);
        if (data.resolved) {
          reject(data.resolved);
        } else {
          reject(data.rejected);
        }
      };
      iframe.contentWindow.postMessage("from-parent", "*");
    };
    iframe.src = iframeSrc;
  });
}

function loadResourceIntoContainer(resource, timeout) {
  var opts = {
    src: resource.src,
    container: container
  };
  if (resource.type === "img") {
    return loadResourceByImgTag(opts, timeout);
  } else if (resource.type === "script") {
    return loadResourceByScriptTag(opts, timeout);
  } else if (resource.type === "css") {
    return loadResourceByLinkRelStylesheetTag(opts, timeout);
  } else if (resource.type === "font") {
    return loadResourceByFontFaceCss(opts, timeout);
  }
  return null;
}

const loadResourceNormally = loadResourceIntoIframe;

module.exports = {
  setContainer,
  clearContainer,
  loadResourceNormally,
  loadResourceByImgTag,
  loadResourceByLinkRelPrefetchTag,
  loadResourceByLinkRelPrefetchTagWithCrossoriginAttr,
  loadResourceByLinkRelStylesheetTag,
  loadResourceByLinkRelStylesheetTagWithBogusMedia,
  loadResourceByNewImage,
  loadResourceByObjectTag,
  loadResourceByScriptTag,
  loadResourceByScriptTagWithBogusType,
  loadResourceByXHR,
  loadResourceByXDomainRequest
};
