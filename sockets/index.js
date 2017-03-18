var fs = require('fs');
var path = require('path');

module.exports = {
  listen: function(server) {
    var io = require('socket.io')(server);

    fs.readdirSync(__dirname)
    .filter(function(file) {
      // Ignore files with leading _ and index.js
      return (file.indexOf('_') === -1 ) && (file !== 'index.js');
    })
    .forEach(function(file) {
      var namespaceModule = require('./'+file);

      if (!namespaceModule.handlers) {
        console.error('Failed to bind ' + file + '. No handlers found.');
        return;
      }

      var namespaceName = path.basename(file, '.js');
      console.log(namespaceName);
      var namespace = io.of(namespaceName);

      namespace.on('connection', function(socket) {
        // Bind the event names with their handlers
        for (event in namespaceModule.handlers) {
          var handler = namespaceModule.handlers[event];
          namespace.on(event, function(req) {
            handler(socket, req, io);
          })
        }
      });
    });
  }
};
