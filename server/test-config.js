// E.g. for Sauce Labs, but also works for local testing.
// Put these entries in your hosts file.

module.exports = {
  http1: "resource-prefetch-tests1",
  http2: "resource-prefetch-tests2",
  https1: "resource-prefetch-tests1",
  https2: "resource-prefetch-tests2"
};

// Local testing only.  Prefer the above if possible.

/*
module.exports = {
  http1: "localhost",
  http2: "127.0.0.1",
  https1: "localhost",
  https2: "127.0.0.1"
};
*/
