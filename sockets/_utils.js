module.exports = {
  generateErrorObj: function(msg, req) {
    return new Error({
      message: msg,
      request: req
    });
  }
};
