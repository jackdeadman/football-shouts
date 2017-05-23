"use strict";

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
      var namespaceModule = require('./' + file);

      if (!namespaceModule.handlers) {
        console.error('Failed to bind ' + file + '. No handlers found.');
        return;
      }

      var namespaceName = path.basename(file, '.js');
      var namespace = io.of(namespaceName);

      namespace.on('connection', function(socket) {
        Object.keys(namespaceModule.handlers).forEach(eventName => {
          let handler = namespaceModule.handlers[eventName];
          socket.on(eventName, req => {
            console.log('************')
            console.log('Event fired');
            console.log(this);
            console.log('************')
            handler(this, req, io);
          });
        });
      });
    });
  }
};
