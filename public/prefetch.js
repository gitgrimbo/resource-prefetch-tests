/* eslint-env browser, amd */
define(["jquery", "./promise-utils", "./resource-loaders"], function($, promiseUtils, resourceLoaders) {
  var timeoutify = promiseUtils.timeoutify;
  var countdownResolver = promiseUtils.countdownResolver;

  var container = document.getElementById("prefetch-container") || document.body;
  var timeout = 5000;

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

  function loadResources(loader) {
    return function(srcs) {
      return new Promise(function(resolve, reject) {
        var c = countdownResolver(resolve, srcs.length);
        srcs.forEach(function(src, i) {
          loader({
            src: src,
            container: container
          }, timeout)
            .then(c.callback(i), c.errback(i));
        });
      });
    };
  }

  var loadResourcesByNewImage = loadResources(loadResourceByNewImage);
  var loadResourcesByImgTag = loadResources(loadResourceByImgTag);
  var loadResourcesByScriptTag = loadResources(loadResourceByScriptTag);
  var loadResourcesByXHR = loadResources(loadResourceByXHR);
  var loadResourcesByLinkRelStylesheetTag = loadResources(loadResourceByLinkRelStylesheetTag);
  var loadResourcesByObjectTag = loadResources(loadResourceByObjectTag);
  var loadResourcesByLinkRelPrefetchTag = loadResources(loadResourceByLinkRelPrefetchTag);
  var loadResourcesByLinkRelPrefetchTagWithCrossoriginAttr = loadResources(loadResourceByLinkRelPrefetchTagWithCrossoriginAttr);

  function loadResourcesNormally(resources) {
    return new Promise(function(resolve, reject) {
      var c = countdownResolver(resolve, resources.length);
      resources.forEach(function(resource, i) {
        loadResourceNormally(resource, timeout)
          .then(c.callback(i), c.errback(i));
      });
    });
  }

  return {
    setContainer: setContainer,
    clearContainer: clearContainer,
    loadResourceNormally: loadResourceNormally,
    loadResourceByImgTag: loadResourceByImgTag,
    loadResourceByLinkRelPrefetchTag: loadResourceByLinkRelPrefetchTag,
    loadResourceByLinkRelPrefetchTagWithCrossoriginAttr: loadResourceByLinkRelPrefetchTagWithCrossoriginAttr,
    loadResourceByLinkRelStylesheetTag: loadResourceByLinkRelStylesheetTag,
    loadResourceByNewImage: loadResourceByNewImage,
    loadResourceByObjectTag: loadResourceByObjectTag,
    loadResourceByScriptTag: loadResourceByScriptTag,
    loadResourceByXHR: loadResourceByXHR,
    loadResourcesNormally: loadResourcesNormally,
    loadResourcesByImgTag: loadResourcesByImgTag,
    loadResourcesByLinkRelPrefetchTag: loadResourcesByLinkRelPrefetchTag,
    loadResourcesByLinkRelPrefetchTagWithCrossoriginAttr: loadResourcesByLinkRelPrefetchTagWithCrossoriginAttr,
    loadResourcesByLinkRelStylesheetTag: loadResourcesByLinkRelStylesheetTag,
    loadResourcesByNewImage: loadResourcesByNewImage,
    loadResourcesByObjectTag: loadResourcesByObjectTag,
    loadResourcesByScriptTag: loadResourcesByScriptTag,
    loadResourcesByXHR: loadResourcesByXHR
  };
});
