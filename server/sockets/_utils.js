"use strict";

module.exports = {
  generateErrorObj: function(msg, req) {
    console.log(msg, req)
    return new Error({
      message: msg,
      request: req
    });
  }
};
