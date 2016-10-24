/* eslint-env amd */
define([
  "intern",
  "intern/dojo/lang",
  "./intern-base"
], function(intern, lang, config) {
  config = lang.mixin(config, {
    proxyHost: "resource-prefetch-tests1",

    // The port on which the instrumenting proxy will listen
    proxyPort: 9000,

    // A fully qualified URL to the Intern proxy
    proxyUrl: "http://resource-prefetch-tests1:9000/",

    // Location of the Selenium grid.
    tunnelOptions: {
      hostname: "localhost",
      port: 4444
    },

    maxConcurrency: 4,

    environments: [],

    defaultTimeout: 60 * 1000,

    // One functional test.
    functionalSuites: ["test/functional/functional"],

    testHarnessUrl: "http://resource-prefetch-tests1:3002/?autostart=true"
  });

  return config;
});
