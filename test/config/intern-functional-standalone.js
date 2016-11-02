/* eslint-env amd */
define([
  "intern/dojo/has",
  "./intern-functional",
  "./env"
], function(has, config, env, ServerManager) {
  config.environments = [
    env.env("chrome"),
    env.env("firefox"),
    env.env("internet explorer")
  ];

  return config;
});
