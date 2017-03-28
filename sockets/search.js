"use strict";

var Tweet = require('../models/Tweet');
var generateErrorObj = require('./_utils').generateErrorObj;
var threshold = require('../config').cache.threshold;

function findTransfers(player, club, callback) {
  /**
   * Finds tweets between players and clubs using database and twitter
   * @param player: String of the player
   * @param club: String of the club
   * @param callback: fn(err, tweets)
   */
  var lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  console.log(lastWeek);
  var query = {
    player: player,
    club: club,
    query: player + ' ' + club, // temp
    since: lastWeek, until: new Date(Date.now())
  };

  Tweet.getFromDatabase(query, function(databaseErr, databaseTweets) {
    var tweets = databaseTweets || [];

    var countFromDatabase = tweets.length;
    var countFromTwitter = 0;

    var latest = tweets[0];

    // Update if no tweets found or too old
    if (!latest || (Date.now() - latest.createdAt) > threshold) {
      console.log('Searching Twitter');
      // Only get newer tweets than latest
      if (latest) {
        query.since = latest.createdAt;
      }

      Tweet.getFromTwitter(query, function(twitterErr, twitterTweets) {
        twitterTweets = twitterTweets || [];
        countFromTwitter = twitterTweets.length;
        tweets = tweets.concat(twitterTweets);

        callback(null, {
          tweets: tweets,
          countFromTwitter: countFromTwitter,
          countFromDatabase: countFromDatabase
        });
        return;
      });
    }

    callback(null, {
      tweets: tweets,
      countFromTwitter: 0,
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
    var errorMsg = null;

    if (!hasRequiredFields) {
      errorMsg = 'Please provide players and a club names.';
      socket.emit(errorEvent, generateErrorObj(errorMsg, req));
      return;
    }

    // Validate that they are arrays
    if (!Array.isArray(req.players) || !Array.isArray(req.clubs)) {
      errorMsg = 'Players and a club names must be arrays.';
      socket.emit(errorEvent, generateErrorObj(errorMsg, req));
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

    // mock graph data
    setTimeout(function() {
      socket.emit('chart', [
        { date: new Date(2017, 3, 1), count: 14},
        { date: new Date(2017, 3, 3), count: 32},
        { date: new Date(2017, 3, 5), count: 101},
        { date: new Date(2017, 3, 7), count: 23},
        { date: new Date(2017, 3, 11), count: 5},
        { date: new Date(2017, 3, 13), count: 58},
        { date: new Date(2017, 3, 20), count: 90},
        { date: new Date(2017, 3, 21), count: 140},
        { date: new Date(2017, 3, 25), count: 58},
        { date: new Date(2017, 3, 27), count: 10}
      ]);
    }, 3000);

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
            allResults.countFromTwitter += results.countFromTwitter;
            allResults.countFromDatabase += results.countFromDatabase;
          }
          if (requests === responses) {
            // allResults = allResults.sort(function(r) { return r.createdAt; })

            // Order by createdAt

            // Remove duplicates

            socket.emit(successEvent, allResults);

            if (errors.length) {
              socket.emit(errorEvent, errors);
            }
          }
        });
      });
    });
  }
};

module.exports.handlers = handlers;
