const ThrottleGroup = require("stream-throttle").ThrottleGroup;

function create(rate) {
  return function throttleMiddleware(req, res, next) {
    const write = res.write;
    const end = res.end;

    const tg = new ThrottleGroup({ rate: rate });
    const throttle = tg.throttle();

    throttle.on("end", end.bind(res));
    throttle.on("data", write.bind(res));
    res.write = throttle.write.bind(throttle);
    res.end = throttle.end.bind(throttle);

    next();
  };
}

module.exports = create;
