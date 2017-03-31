"use strict";

var Tweet = require('../models/Tweet');
var modelUtils = require('../models/_utils');

var handlers = {
  subscribe: function(socket, req) {
    if (socket.livetweets) {
      // A client can only subscribe to one stream at a time
      socket.livetweets.disconnect();
      socket.livetweets = null;
    }

    var player = req.player;
    var club = req.club;

    var livetweets = Tweet.live({
      player: player,
      club: club
    });

    livetweets.connect();

    livetweets.on('tweet', function(tweet) {
      console.log('I HAZ TWEET');
      socket.emit('tweet', modelUtils.makeTweetObject(tweet));
    });


    // Needs to be set here to remember which livetweets to disconnect
    socket.on('disconnect', function() {
      livetweets.disconnect();
    });

    socket.livetweets = livetweets;
  }
};

module.exports.handlers = handlers;
