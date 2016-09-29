/* eslint-env browser, amd */
define(["./Resource"], function(Resource) {
  var r = Resource.from;
  return [
    r("/download-files/11B.css", "css"),
    r("/download-files/146kB.css", "css"),
    r("/download-files/1516kB.jpg", "img"),
    r("/download-files/256kB.jpg", "img"),
    r("/download-files/30.8kB.js", "script"),
    r("/download-files/6.9kB.js", "script"),
    r("/download-files/64kB.jpg", "img"),
    r("/download-files/779kB.js", "script"),
    r("/download-files/8B.js", "script"),
    r("/download-files/pacifico.woff", "font")
  ];
});
