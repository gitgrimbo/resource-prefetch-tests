const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const uaParser = require("ua-parser-js");
const uuid = require("node-uuid");

module.exports = class SessionManager {
  constructor() {
    this.sessions = {};
    this.sessionId = 0;
  }

  startSession(attrs) {
    const id = uuid.v4();
    const session = Object.assign({}, attrs, {
      timestamp: Date.now(),
      sessionId: id,
      tests: {},
      active: true
    });
    this.sessions[id] = session;

    return session;
  }

  endSession(sessionId) {
    const session = this.sessions[sessionId];
    session.active = false;

    return session;
  }

  getSessions() {
    return this.sessions;
  }

  getSessionIds() {
    return Object.keys(this.sessions);
  }

  getSession(sessionId, strict) {
    const session = this.sessions[sessionId];
    if (strict === true && !session) {
      throw new Error("session " + sessionId + " does not exist");
    }

    return session;
  }

  makeSessionFilename(session) {
    const ua = uaParser(session.userAgent);

    return session.timestamp + "-" + session.sessionId + "-" + ua.browser.name + "-" + ua.browser.version;
  }

  saveSession(sessionId, sessionSaveDir, cb) {
    const session = this.sessions[sessionId];
    const filepath = path.join(sessionSaveDir, this.makeSessionFilename(session) + ".json");
    mkdirp(sessionSaveDir, function(err) {
      if (err) return cb(err);
      fs.writeFile(filepath, JSON.stringify(session, null, 1), cb);
    });
  }

  startTest(sessionId, testId, attrs) {
    const session = this.getSession(sessionId, true);
    const test = Object.assign({}, attrs, {
      timestamp: Date.now(),
      testId,
      state: "prefetch"
    });
    session.tests[testId] = test;

    return test;
  }

  newResource(resourceId, resourcePath) {
    return {
      resourceId: resourceId,
      server: this.newServerResults(resourcePath)
    };
  }

  newServerResults(resourcePath) {
    return {
      path: resourcePath,
      prefetch: {
        requested: false,
        statusCode: null
      },
      normal: {
        requested: false,
        statusCode: null
      }
    };
  }

  ensureHasResource(test, resourceId, resourcePath) {
    if (!test.resource) {
      test.resource = this.newResource(resourceId, resourcePath);
    }
    if (!test.resource.server) {
      test.resource.server = this.newServerResults(resourcePath);
    }
    return test.resource;
  }

  testResourceRequest(sessionId, testId, resourceId, resourcePath, resourceUrl, requestHeaders) {
    console.log("testResourceRequest", sessionId, testId, resourceId, resourcePath, requestHeaders);
    const session = this.getSession(sessionId, true);
    const test = session.tests[testId];
    console.log("testResourceRequest", "session", Boolean(session), "test", Boolean(test));

    const resource = this.ensureHasResource(test, resourceId, resourcePath);

    const prefetchOrNormal = (test.state === "prefetch") ? resource.server.prefetch : resource.server.normal;
    prefetchOrNormal.url = resourceUrl;
    prefetchOrNormal.requested = true;
    prefetchOrNormal.requestHeaders = requestHeaders;

    return test;
  }

  testResourceResponse(sessionId, testId, resourceId, resourcePath, statusCode, responseHeaders) {
    console.log("testResourceResponse", sessionId, testId, resourceId, statusCode, responseHeaders);
    const session = this.getSession(sessionId, true);
    const test = session.tests[testId];

    const resource = this.ensureHasResource(test, resourceId, resourcePath);

    const prefetchOrNormal = (test.state === "prefetch") ? resource.server.prefetch : resource.server.normal;
    prefetchOrNormal.statusCode = statusCode;
    prefetchOrNormal.responseHeaders = responseHeaders;
    if (responseHeaders["access-control-allow-origin"]) {
      prefetchOrNormal.cors = true;
    }

    return test;
  }

  testStartNormalDownload(sessionId, testId) {
    const session = this.getSession(sessionId, true);
    const test = session.tests[testId];
    test.state = "normal";

    return test;
  }

  endTest(sessionId, testId, clientData) {
    const session = this.getSession(sessionId, true);
    const test = session.tests[testId];
    test.state = "ended";
    // test.resource should be present unless the browser hasn't been able to
    // make either the prefetch or the normal request!
    const resource = this.ensureHasResource(test, null, null);
    resource.client = clientData;

    return test;
  }
};
