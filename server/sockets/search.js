"use strict";

var Tweet = require('../models/Tweet');
var generateErrorObj = require('./_utils').generateErrorObj;
var threshold = require('../config').cache.threshold;
var moment = require('moment');

var findTransfers = (player, club, authors, sources, operator, callback) => {
  /**
   * Finds tweets between players and clubs using database and twitter
   * @param {String} player: Player name
   * @param {String} club: club name
   * @param {[String]} authors: author names
   * @param {Function} callback: fn(err, tweets)
   */
  var lastWeek = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  var today = new Date(Date.now());

  // Build query object
  var query = {
    player,
    operator,
    club,
    authors,
    since: lastWeek, until: today
  };

  // Helper boolean
  var useDatabase = sources.indexOf('database') > -1;
  var useTwitter = sources.indexOf('twitter') > -1;

  if (useDatabase) {
    Tweet.getFromDatabase(query, (databaseErr, databaseTweets) => {
      // Ensure the Tweets are in order in order to get the latest
      databaseTweets = databaseTweets.sort((t1, t2) => {
        return new Date(t1.updatedAt) >= new Date(t2.updatedAt) ? -1 : 1;
      });

      databaseTweets = databaseTweets.map(tweet => {
        tweet.source = 'database';
        return tweet;
      });

      var latest = databaseTweets[0];
      // Update if no tweets found or too old
      if (!latest || ((today - new Date(latest.updatedAt)) > threshold)) {
        if (latest) {
          query.since = new Date(latest.datePublished);
        }

        if (useTwitter) {
          Tweet.getFromTwitter(query, (twitterErr, twitterTweets) => {
            twitterTweets = twitterTweets.map(tweet => {
              tweet.source = 'twitter';
              return tweet;
            });
            callback(null, databaseTweets.concat(twitterTweets));
          });
        } else {
          callback(null, databaseTweets);
        }
      } else {
        callback(null, databaseTweets);
      }
    });
    // Just using twitter
  } else if (useTwitter) {
    Tweet.getFromTwitter(query, (twitterErr, twitterTweets) => {
      twitterTweets = twitterTweets.map(tweet => {
        tweet.source = 'twitter';
        return tweet;
      });
      callback(null, twitterTweets);
    });
    // No known sources selected
  } else {
    callback(new Error('No sources found.'));
  }
};

var findAllTweets = (req, callback) => {
  /**
   * Finds all the tweets for a list of player and clubs from different sources
   * using all the combinations of the players and clubs.
   * @param {Object} req: query and sources
   * @param {String[]} req.players: list of player names
   * @param {String[]} req.clubs: list of clubs names
   * @param {String[]} req.authors: list of author names
   * @param {String[]} req.sources: list of sources from set {'twitter, database'}
   * @param {String} req.operator: An operator from set {AND, OR}
   * @param {Function} callback: fn(err, list of tweets)
   */

  // Holding variables
  var requests = req.players.length * req.clubs.length;
  var responses = 0;
  var errors = [];
  var allTweets = [];

  // Search using all combinations
  req.players.forEach(player => {
    req.clubs.forEach(club => {
      findTransfers(player, club, req.authors, req.sources, req.operator, (err, tweets) => {
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

        // All responses finished
        if (requests === responses) {
          // Order by datePublished
          allTweets = allTweets.sort((t1, t2) => {
            var datePublished1 = new Date(t1.datePublished);
            var datePublished2 = new Date(t2.datePublished);
            return datePublished1 >= datePublished2 ? -1 : 1;
          });

          // Remove duplicate twitters
          var prev = { twitterId: null };
          allTweets = allTweets.filter(t => {
            var different = prev.twitterId !== t.twitterId;
            prev = t;
            return different;
          });

          if (errors.length) {
            callback(errors, allTweets);
          } else {
            callback(null, allTweets);
          }
        }
      });
    });
  });
};

var groupByDay = (tweets) => {
  /**
   * Group a list of tweets by the day they were published
   * @type {Object[]} tweets: list of tweet objects
   * @type {String} tweets.datePublished: date string of when a tweet was made
   */
  var chartData = {};
  // Create an object where the key is the date and the value is the count
  tweets.forEach(tweet => {
    // var newDate = moment(tweet.datePublished).startOf('day').format();
    var newDate = moment(tweet.datePublished).startOf('day').format();
    if (chartData[newDate]) {
      chartData[newDate]++;
    } else {
      chartData[newDate] = 1;
    }
  });

  // Convert this object into an array of {date, count} objects ordered
  // by datePublished
  var finalChartData = [];
  for (var date in chartData) {
    finalChartData.push({ date: date, count: chartData[date] });
  }
  finalChartData = finalChartData.sort((d1, d2) => {
    return new Date(d1.date) > new Date(d2.date) ? 1 : -1;
  });

  return finalChartData;
};

/**
 * Handler Start for /search
 * To connect on client: io('/search');
 */
var handlers = {
  
  // socket.on('playerData', req);
  playerData: (socket, players) => {
    var errorEvent = 'error';

    if (!players) {
      var errorMsg = 'Please provide a list of players';
      socket.emit(errorEvent, generateErrorObj(errorMsg, req));
      return;
    }

    var emitter = d => socket.emit('playerData', d);

    var fetchPlayersData = Tweet.getPlayerInfoFromDb(players[0]);
    fetchPlayersData.then(playerData => {
      console.log('PLAYER DATA DB')
      console.log(playerData);
      if (playerData) {
        emitter(playerData);
      } else {
        Tweet.getPlayerClubWikidata(players[0]).then(playerDataWIKI => {
          console.log('PLAYER DATA WIKI')
          console.log(playerDataWIKI);
          emitter(playerDataWIKI);
        });
      }
    });
  },

  // socket.on('query', req);
  query: (socket, req) => {
    /**
     * @param {socketIO} socket: Connection to a client.
     * @param {Object} req: request from the client.
     * @param {String[]} req.players: List of player names
     * @param {String[]} req.clubs: List of club names
     * @param {String[]} req.authors: List of author names
     * @param {String[]} req.sources: List of sources
     *                                 from the set {'twitter', 'database'}
     * @param {String} req.operator: Operator
     *                                 from the set {'AND', 'OR'}
     */
    console.log(req);
    // Events to be emitted
    var errorEvent = 'error';
    var resultEvent = 'result';
    var chartEvent = 'chart';

    // Validate user has given correct fields
    var hasRequiredFields = req && req.players && req.clubs && req.sources
                              && req.authors && req.operator;
    var errorMsg = null;

    if (!hasRequiredFields) {
      errorMsg = 'Please provide players, clubs and author names and the sources.';
      socket.emit(errorEvent, generateErrorObj(errorMsg, req));
      return;
    }

    // Validate that they are arrays
    if (!Array.isArray(req.players) || !Array.isArray(req.clubs)
        || !Array.isArray(req.sources) || !Array.isArray(req.authors)) {
      errorMsg = 'Players and a club names must be arrays.';
      socket.emit(errorEvent, generateErrorObj(errorMsg, req));
      return;
    }

    findAllTweets(req, (err, allTweets) => {
      // Squash into a final results object
      var resultObj = allTweets.reduce((acc, tweet) => {
        return {
          // Combine tweets by concatenation
          tweets: acc.tweets.concat([tweet]),
          // Add the totals together
          countFromTwitter: acc.countFromTwitter
                                + (tweet.source === 'twitter'),
          countFromDatabase: acc.countFromDatabase
                                + (tweet.source === 'database'),
        };
      }, { tweets: [], countFromDatabase: 0, countFromTwitter: 0 });

      // Group tweets for the chart
      var chartData = groupByDay(allTweets);

      // Send the results to the user
      socket.emit(resultEvent, resultObj);
      socket.emit(chartEvent, chartData);
    });
  }
};

module.exports.handlers = handlers;
