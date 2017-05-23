"use strict";

module.exports = {
  generateErrorObj: function(msg, req) {
    console.log(msg)
    console.log(req);
    return new Error({
      message: msg,
      request: req
    });
  }
};
