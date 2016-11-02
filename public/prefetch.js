import promiseUtils from "./promise-utils";
import resourceLoaders from "./resource-loaders";

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
var loadResourceByXHR = timeoutifyLoader("loadResourceByXHR");
var loadResourceByXDomainRequest = timeoutifyLoader("loadResourceByXDomainRequest");
var loadResourceByLinkRelStylesheetTag = timeoutifyLoader("loadResourceByLinkRelStylesheetTag");
var loadResourceByLinkRelPrefetchTag = timeoutifyLoader("loadResourceByLinkRelPrefetchTag");
var loadResourceByLinkRelPrefetchTagWithCrossoriginAttr = timeoutifyLoader("loadResourceByLinkRelPrefetchTagWithCrossoriginAttr");

function loadResourceNormally(resource, timeout) {
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

export default {
  setContainer,
  clearContainer,
  loadResourceNormally,
  loadResourceByImgTag,
  loadResourceByLinkRelPrefetchTag,
  loadResourceByLinkRelPrefetchTagWithCrossoriginAttr,
  loadResourceByLinkRelStylesheetTag,
  loadResourceByNewImage,
  loadResourceByObjectTag,
  loadResourceByScriptTag,
  loadResourceByXHR,
  loadResourceByXDomainRequest
};
