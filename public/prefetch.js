const promiseUtils = require("./promise-utils");
const resourceLoaders = require("./resource-loaders");

const timeoutify = promiseUtils.timeoutify;

let container = document.getElementById("prefetch-container") || document.body;

function setContainer(container_) {
  container = container_;
}

function clearContainer() {
  $(container).empty();
}

function timeoutifyLoader(loaderName) {
  return timeoutify(resourceLoaders[loaderName], loaderName);
}

const loadResourceByFontFaceCss = timeoutifyLoader("loadResourceByFontFaceCss");
const loadResourceByNewImage = timeoutifyLoader("loadResourceByNewImage");
const loadResourceByImgTag = timeoutifyLoader("loadResourceByImgTag");
const loadResourceByObjectTag = timeoutifyLoader("loadResourceByObjectTag");
const loadResourceByScriptTag = timeoutifyLoader("loadResourceByScriptTag");
const loadResourceByScriptTagWithBogusType = timeoutifyLoader("loadResourceByScriptTagWithBogusType");
const loadResourceByXHR = timeoutifyLoader("loadResourceByXHR");
const loadResourceByXDomainRequest = timeoutifyLoader("loadResourceByXDomainRequest");
const loadResourceByLinkRelStylesheetTag = timeoutifyLoader("loadResourceByLinkRelStylesheetTag");
const loadResourceByLinkRelStylesheetTagWithBogusMedia = timeoutifyLoader("loadResourceByLinkRelStylesheetTagWithBogusMedia");
const loadResourceByLinkRelPrefetchTag = timeoutifyLoader("loadResourceByLinkRelPrefetchTag");
const loadResourceByLinkRelPrefetchTagWithCrossoriginAttr = timeoutifyLoader("loadResourceByLinkRelPrefetchTagWithCrossoriginAttr");

function loadResourceIntoIFRAME(resource, timeout) {
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
  const opts = {
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

const loadResourceNormally = loadResourceIntoIFRAME;

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
