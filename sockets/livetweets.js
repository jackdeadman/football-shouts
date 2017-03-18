var Tweet = require('../models/Tweet');

var handlers = {
  subscribe: function(req) {
    var player = req.player;
    var club = req.club;

    var livetweets = Tweet.live({
      player: player,
      club: clib
    });

    livetweets.on('tweet', function(tweet) {
      console.log('I HAZ TWEET');
      socket.emit('tweet', tweet);
    });
  }
}

module.exports.handlers = handlers;
