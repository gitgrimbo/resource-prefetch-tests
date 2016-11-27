const tests = [
  {
    name: "new Image()",
    prefetcherName: "loadResourceByNewImage"
  }, {
    name: "XHR",
    prefetcherName: "loadResourceByXHR"
  }, {
    name: "XDomainRequest",
    prefetcherName: "loadResourceByXDomainRequest"
  }, {
    name: "<object>",
    prefetcherName: "loadResourceByObjectTag"
  }, {
    name: "<link rel=prefetch>",
    prefetcherName: "loadResourceByLinkRelPrefetchTag"
  }, {
    name: "<link rel=prefetch crossorigin>",
    prefetcherName: "loadResourceByLinkRelPrefetchTagWithCrossoriginAttr"
  }, {
    name: "<link rel=stylesheet media='(min-width: 40000px)'>",
    prefetcherName: "loadResourceByLinkRelStylesheetTagWithBogusMedia"
  },
];

module.exports = tests;
