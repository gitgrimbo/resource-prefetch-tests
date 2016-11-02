function Resource(src, type) {
  this.src = src;
  this.type = type;
}

Resource.from = function(src, type) {
  return new Resource(src, type);
};

export default Resource;
