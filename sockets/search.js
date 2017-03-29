"use strict";

var Tweet = require('../models/Tweet');
var generateErrorObj = require('./_utils').generateErrorObj;
var threshold = require('../config').cache.threshold;

function findTransfers(player, club, sources,callback) {
  /**
   * Finds tweets between players and clubs using database and twitter
   * @param player: String of the player
   * @param club: String of the club
   * @param callback: fn(err, tweets)
   */
  var lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  var today = new Date(Date.now());

  var query = {
    player: player,
    club: club,
    query: player + ' ' + club, // temp
    since: lastWeek, until: today
  };
  console.log(sources);
  var useDatabase = sources.indexOf('database') > -1;
  var useTwitter = sources.indexOf('twitter') > -1;
  if (useDatabase) {
    Tweet.getFromDatabase(query, function(databaseErr, databaseTweets) {
      databaseTweets = databaseTweets.map(function(tweet) {
        tweet.source = 'database';
        return tweet;
      });

      var latest = databaseTweets[0];

      // Update if no tweets found or too old
      if (!latest || (Date.now() - latest.createdAt) > threshold) {
        if (latest) {
          query.since = latest.createdAt;
        }

        if (useTwitter) {
          Tweet.getFromTwitter(query, function(twitterErr, twitterTweets) {
            twitterTweets = twitterTweets.map(function(tweet) {
              tweet.source = 'twitter';
              return tweet;
            });
            callback(null, databaseTweets.concat(twitterTweets));
          });
        } else {
          callback(null, databaseTweets);
        }
      }
    });
    // Just using twitter
  } else if (useTwitter) {
    Tweet.getFromTwitter(query, function(twitterErr, twitterTweets) {
      twitterTweets = twitterTweets.map(function(tweet) {
        tweet.source = 'twitter';
        return tweet;
      });
      callback(null, twitterTweets);
    });
    // No known sources selected
  } else {
    callback(new Error('No sources found.'));
  }
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
    var allTweets = [];

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

    if (!req.sources) {
      errorMsg = 'Sources have not been defined.';
      socket.emit(errorEvent, generateErrorObj(errorMsg, req));
      return;
    }

    // Search using all combinations
    req.players.forEach(function(player) {
      req.clubs.forEach(function(club) {
        findTransfers(player, club, req.sources, function(err, tweets) {
          // response has been received
          responses ++;

          // Accumulate the errors, then tell the client when all requests
          // have been made
          if (err) {
            var msg = 'Failed to get the tweets for this query.';
            errors.push(generateErrorObj(msg, req));
          }
          else {
            allTweets = allTweets.concat(tweets);
          }
          console.log(requests === responses);
          if (requests === responses) {
            // Order by createdAt
            allTweets = allTweets.sort(function(t1, t2) {
              return t1.createdAt > t2.createdAt;
            });

            // Remove duplicate twitters
            var prev = { twitterId: null };
            allTweets = allTweets.filter(function(t) {
              var different = prev.twitterId !== t.twitterId;
              prev = t;
              return different;
            });

            // Squash into a final results object
            var resultObj = allTweets.reduce(function(acc, tweet) {
              return {
                tweets: acc.tweets.concat([tweet]),
                countFromTwitter: acc.countFromTwitter
                                      + (tweet.source === 'twitter'),
                countFromDatabase: acc.countFromDatabase
                                      + (tweet.source === 'database'),
              };
            }, { tweets: [], countFromDatabase: 0, countFromTwitter: 0 });

            socket.emit(successEvent, resultObj);

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
