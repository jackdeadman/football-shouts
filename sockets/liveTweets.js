"use strict";

var Tweet = require('../models/Tweet');
var moment = require('moment');

// This should be put into utils
function makeTweetObject(tweet){
  var tweetObject = {
    text: tweet.text,
    twitterId: tweet.id_str,
    datePublished: moment(tweet.created_at,
                            "ddd MMM DD HH:mm:ss ZZ YYYY")
                            .format().toString(),
    hasMedia: !!tweet.entities.media,
    retweetCount: tweet.retweet_count,
    favouriteCount: tweet.favorite_count,
    twitterHandle: tweet.user.screen_name,
    name: tweet.user.name,
    profileImageUrl: tweet.user.profile_image_url
  };

  return tweetObject;
}

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
      socket.emit('tweet', makeTweetObject(tweet));
    });


    // Needs to be set here to remember which livetweets to disconnect
    socket.on('disconnect', function() {
      livetweets.disconnect();
    });

    socket.livetweets = livetweets;
  }
};

module.exports.handlers = handlers;
