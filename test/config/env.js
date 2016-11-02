/* eslint-env amd */
define([], function() {
  function env(browserName, version, platform) {
    var env = {
      browserName: browserName,
      version: version,
      platform: platform
    };
    env.acceptSslCerts = true;
    env.fixSessionCapabilities = false;
    return env;
  }

  var browserNames = {
    "ie": "internet explorer",
    "edge": "MicrosoftEdge"
  };

  function normaliseBrowserName(name) {
    return browserNames[name] || name;
  }

  function fromCommandLineArg(arg) {
    var envs = arg.split(";");
    return envs.map(function(envStr) {
      var split = envStr.split(":");
      var browser = normaliseBrowserName(split[0]);
      var versions = split[1] ? split[1].split(",") : [];
      return env(browser, versions);
    });
  }

  return {
    env: env,
    fromCommandLineArg: fromCommandLineArg,
    normaliseBrowserName: normaliseBrowserName
  };
});
