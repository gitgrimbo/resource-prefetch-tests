/* eslint-env amd */
define([
  "intern/dojo/has"
], function(has) {
  var config = {
    // Nothing should be instrumented
    excludeInstrumentation: /.*/,

    reporters: has("host-node") ? ["Pretty"] : [],

    // No loader config.
    loaderOptions: {},

    // No unit tests.
    suites: []
  };

  return config;
});
