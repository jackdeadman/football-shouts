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
     * @param {String[]} req.authors: List of author names
     */

    console.log('SUBSCRIBING');
    console.log(req);
    if (socket.livetweets) {
      // A client can only subscribe to one stream at a time
      socket.livetweets.disconnect();
      socket.livetweets = null;
    }
    console.log(req);
    Tweet.live(req).then(livetweets => {
      livetweets.connect();

      // emit the normalised version of a tweet to the client
      livetweets.on('tweet', function(tweet) {
        socket.emit('tweet', modelUtils.makeTweetObject(tweet));
      });

      // Needs to be set here to remember which livetweets to disconnect
      socket.on('disconnect', function() {
        livetweets.disconnect();
      });

      socket.on('unsubscribe', function() {
        livetweets.disconnect();
      });

      socket.livetweets = livetweets;
    });
  }
};

module.exports.handlers = handlers;
