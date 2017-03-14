function findTransfers(player, club) {
  var results = {
    tweets: [
      { text: 'OMG WAYNE ROONEY IS GOING 2 BRIGHTON' }
    ]
  };
  return results;
}

module.exports = {
  listen: function(server) {
    var io = require('socket.io')(server);

    io.on('connection', function(socket) {
      console.log('connected.');
      socket.on('search', function(req) {
        if (req && req.player && req.club) {
          var results = findTransfers(req.player && req.club);
          socket.emit('searchResult', results);
        } else {
          socket.emit('searchError', {
            errorMessage: 'Please provide a player and a club name.'
          });
        }
      });
    });
  }
}
