var Tweet = require('../models/Tweet');

var handlers = {
  subscribe: function(req, socket) {
    var player = req.player;
    var club = req.club;

    var livetweets = Tweet.live({
      player: player,
      club: clib
    });

    livetweets.connect();

    livetweets.on('tweet', function(tweet) {
      console.log('I HAZ TWEET');
      socket.emit('tweet', tweet);
    });

    socket.livetweets = livetweets;
  },

  disconect: function(req, socket) {
    socket.livetweets.disconect();
  }
}

module.exports.handlers = handlers;
