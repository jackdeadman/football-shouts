module.exports = {
  listen: function(server) {
    var io = require('socket.io')(server);

    io.on('connection', function(socket) {
      console.log('connected.');
      socket.on('search', function(socket) {
        
      });
    });
  }
}
