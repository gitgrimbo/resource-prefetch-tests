/* eslint-env amd */
define([], function() {
  return function env(browserName, version, platform) {
    var env = {
      browserName: browserName,
      version: version,
      platform: platform
    };
    env.acceptSslCerts = true;
    env.fixSessionCapabilities = false;
    return env;
  };
});
