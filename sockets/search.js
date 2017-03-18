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

  console.log(query);

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
    // Events
    var errorEvent = 'error';
    var successEvent = 'result';

    // Validate user has given correct fieds
    var hasRequiredFields = req && req.players && req.clubs;
    if (!hasRequiredFields) {
      var msg = 'Please provide players and a club names.';
      socket.emit(errorEvent, generateErrorObj(msg, req));
      return;
    }

    // Validate that they are arrays
    if (!Array.isArray(req.players) || !Array.isArray(req.clubs)) {
      var msg = 'Players and a club names must be arrays.';
      socket.emit(errorEvent, generateErrorObj(msg, req));
      return;
    }

    // Holding variables
    var requests = req.players.length * req.clubs.length;
    var responses = 0;
    var errors = [];
    var allResults = {
      tweets: [],
      countFromTwitter: 0,
      countFromDatabase: 0
    };

    // Search using all combinations
    req.players.forEach(function(player) {
      req.clubs.forEach(function(club) {
        findTransfers(player, club, function(err, results) {
          // response has been received
          responses ++;
          // Accumulate the errors, then tell the client when all requests
          // have been made
          if (err) {
            var msg = 'Failed to get the tweets for this query.';
            errors.push(generateErrorObj(msg, req));
          }
          else {
            allResults.tweets = allResults.tweets.concat(results.tweets);
            allResults.countFromTwitter += allResults.countFromTwitter;
            allResults.countFromDatabase += allResults.countFromDatabase
          }
          if (requests === responses) {
            // allResults = allResults.sort(function(r) { return r.createdAt; })
            socket.emit(successEvent, allResults);

            if (errors.length) {
              socket.emit(errorEvent, errors);
            }
          }
        });
      })
    });
  }
};

module.exports.handlers = handlers;
