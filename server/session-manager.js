const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const uaParser = require("ua-parser-js");

module.exports = class SessionManager {
  constructor() {
    this.sessions = {};
    this.sessionId = 0;
  }

  startSession(attrs) {
    const id = ++this.sessionId;
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
      state: "prefetch",
      resource: null
    });
    session.tests[testId] = test;
    return test;
  }

  testResourceRequest(sessionId, testId, resourceId, resourcePath) {
    const session = this.getSession(sessionId, true);
    const test = session.tests[testId];
    test.resource = test.resource || {
      path: resourcePath,
      resourceId: resourceId,
      server: {
        prefetch: {
          requested: false,
          statusCode: null
        },
        normal: {
          requested: false,
          statusCode: null
        }
      }
    };
    const resource = test.resource;
    const prefetchOrNormal = (test.state === "prefetch") ? resource.server.prefetch : resource.server.normal;
    prefetchOrNormal.requested = true;
    return test;
  }

  testResourceResponse(sessionId, testId, resourceId, statusCode) {
    const session = this.getSession(sessionId, true);
    const test = session.tests[testId];
    const resource = test.resource;
    const prefetchOrNormal = (test.state === "prefetch") ? resource.server.prefetch : resource.server.normal;
    prefetchOrNormal.statusCode = statusCode;
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
    const resource = test.resource;
    resource.client = clientData;
    return test;
  }
};
