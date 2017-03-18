var Tweet = require('../models/Tweet');

var handlers = {
  subscribe: function(socket, req) {
    var player = req.player;
    var club = req.club;

    var livetweets = Tweet.live({
      player: player,
      club: club
    });

    livetweets.connect();

    livetweets.on('tweet', function(tweet) {
      console.log('I HAZ TWEET');
      socket.emit('tweet', tweet);
    });

    console.log(socket)
    socket.livetweets = livetweets;
  },

  unsubscribe: function(socket, req) {
    socket.livetweets.disconect();
  },

  disconect: function(socket, req) {
    socket.livetweets.disconect();
  }
}

module.exports.handlers = handlers;
