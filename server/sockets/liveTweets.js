"use strict";

var Tweet = require('../models/Tweet');
var modelUtils = require('../models/_utils');

var handlers = {
  subscribe: function(socket, req) {
    /**
     * @param {socketIO} socket: Connection to a client.
     * @param {Object} req: request from the client.
     * @param {String[]} req.players: List of player names
     * @param {String[]} req.clubs: List of club names
     */
    if (socket.livetweets) {
      // A client can only subscribe to one stream at a time
      socket.livetweets.disconnect();
      socket.livetweets = null;
    }

    var players = req.players;
    var clubs = req.clubs;

    var livetweets = Tweet.live({ players, clubs });
    livetweets.connect();

    // emit the normalised version of a tweet to the client
    livetweets.on('tweet', function(tweet) {
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
