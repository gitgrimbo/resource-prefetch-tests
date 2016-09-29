/* eslint-env browser, amd */
define(["jquery"], function($) {
  return function extend() {
    return $.extend.apply($, arguments);
  };
});
