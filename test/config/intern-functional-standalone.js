/* eslint-env amd */
define([
  "intern/dojo/has",
  "./intern-functional",
  "./env",
  //"intern/dojo/has!host-node?./server-manager"
], function(has, config, env, ServerManager) {
  config.environments = [
    env("chrome"),
    env("firefox"),
    env("internet explorer")
  ];

  if (has("host-node")) {
    //new ServerManager().handleStartAndStop(config);
  }

  return config;
});
