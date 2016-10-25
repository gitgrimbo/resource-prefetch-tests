/* eslint-env browser, amd */
define([], function() {
  var tests = [
    {
      name: "new Image()",
      prefetcherName: "loadResourceByNewImage"
    }, {
      name: "XHR",
      prefetcherName: "loadResourceByXHR"
    }, {
      name: "<object>",
      prefetcherName: "loadResourceByObjectTag"
    }, {
      name: "<link rel=prefetch>",
      prefetcherName: "loadResourceByLinkRelPrefetchTag"
    }, {
      name: "<link rel=prefetch crossorigin>",
      prefetcherName: "loadResourceByLinkRelPrefetchTagWithCrossoriginAttr"
    }
  ];

  return tests;
});
