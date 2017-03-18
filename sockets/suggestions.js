var handlers = {
  partialQuery: function(socket, partialQuery) {
    socket.emit('suggestion', {
      suggestion: '@WayneRooney',
      partialQuery: '@Wayn'
    });
  }
};

module.exports.handlers = handlers;
