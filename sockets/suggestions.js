"use strict";

var handlers = {
  partialQuery: function(socket, partialQuery) {
    socket.emit('suggestion', {
      suggestion: '@WayneRooney',
      partialQuery: partialQuery
    });
  }
};

module.exports.handlers = handlers;
