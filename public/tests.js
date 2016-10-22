/* eslint-env browser, amd */
define(["./prefetch"], function(prefetch) {
  // The prefetcher functions here should have been 'timeoutified' already.
  // See prefetch.js
  var tests = [
    {
      name: "new Image()",
      prefetcher: prefetch.loadResourceByNewImage
    }, {
      name: "XHR",
      prefetcher: prefetch.loadResourceByXHR
    }, {
      name: "<object>",
      prefetcher: prefetch.loadResourceByObjectTag
    }, {
      name: "<link rel=prefetch>",
      prefetcher: prefetch.loadResourceByLinkRelPrefetchTag
    }
  ];

  return tests;
});
