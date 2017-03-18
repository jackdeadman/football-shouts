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

    var latest = tweets[0];
    countFromTwitter = tweets.length;

    if (latest.datatime > threshold) {
      // Only get newer tweets than latest
      query.since = latest.datatime;

      Tweet.getFromTwitter(query, function(twitterErr, twitterTweets) {
        if (databaseErr) {
          twitterTweets = [];
        }
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
    // Events
    var errorEvent = 'searchError';
    var successEvent = 'searchResult';

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
      socket.emit(successEvent, results);
    });
  }
};

module.exports.handlers = handlers;
