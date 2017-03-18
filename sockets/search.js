var Tweet = require('../models/Tweet');
var generateErrorObj = require('./_utils').generateErrorObj;

function findTransfers(player, club, callback) {
  /**
   * Finds tweets between players and clubs using database and twitter
   * @param player: String of the player
   * @param club: String of the club
   * @param callback: fn(err, tweets)
   */
  var query = {
    player: player,
    club: club,
    since: "2016-03-10", until: "2017-03-17"
  };

  var countFromTwitter = 0;
  var countFromDatabase = 0;
  var tweets = [];

  Tweet.getFromDatabase(query, function(databaseErr, databaseTweets) {
    tweets = databaseTweets || tweets;
    countFromTwitter = tweets.length;
    var latest = tweets[0];

    if (tweets.length < 5 || latest.datatime > threshold) {
      // Only get newer tweets than latest
      if (tweets.length) {
        query.since = latest.datatime;
      }

      Tweet.getFromTwitter(query, function(twitterErr, twitterTweets) {
        twitterTweets = twitterTweets || [];
        countFromDatabase = databaseTweets.length;
        tweets = tweets.concat(twitterTweets);
      });
    }

    callback(null, {
      tweets: tweets,
      countFromTwitter: countFromTwitter,
      countFromDatabase: countFromDatabase
    });
  });
}

var handlers = {

  query: function(socket, req) {
    console.log('Query', req);
    // Events
    var errorEvent = 'error';
    var successEvent = 'result';

    var hasRequiredFields = req && req.player && req.club;
    if (!hasRequiredFields) {
      var msg = 'Please provide a player and a club name.';
      socket.emit(errorEvent, generateErrorObj(msg, req));
      return;
    }

    findTransfers(req.player, req.club, function(err, results) {
      if (err) {
        var msg = 'Failed to get the tweets for this query.';
        socket.emit(errorEvent, generateErrorObj(msg, req));
        return;
      }
      console.log('Sending results', results);
      socket.emit(successEvent, results);
    });
  }
};

module.exports.handlers = handlers;
