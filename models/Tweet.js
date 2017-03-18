'use strict';

var database = require('./Database');
var T = require('twit');
var config = require('../config').twitter;
var dbTweet = database.Tweet;

var client = new T({
 consumer_key: config.consumerKey,
 consumer_secret: config.consumerSecret,
 access_token: config.accessToken,
 access_token_secret: config.accessTokenSecret
});

function makeTweetObject(tweet){
  var tweetObject = {
    text: tweet.text,
    tweetId: tweet.id_str,
    createdAt: tweet.created_at,
    hasMedia: !!tweet.entities.media,
    retweetCount: tweet.retweet_count,
    favouriteCount: tweet.favorite_count
  };

  return tweetObject;
}

function saveTweet(tweet, callback){
  var tweetObject = dbTweet.build(tweet);
  tweetObject.save(callback);
}

module.exports.getFromTwitter = function(queryTerms, callback){
  var twitterQuery = buildQuery(queryTerms);

    client.get('search/tweets', { q: twitterQuery, count: 10, result_type: "popular" }, function(err, queryResult){
      if(err){
        console.error("failed to get tweets from twitter");
        callback(err);
        return;
      }

      var tweetList = queryResult.statuses;
      // need to save hashtags to a different table probably
      
      tweetList = tweetList.map(makeTweetObject);
      callback(null, tweetList);

      tweetList.forEach(function(tweet){
        saveTweet(tweet, function(err, tweet){
          if(err){
            console.error("error saving to db");
            // may be able to recover from some errors
            return;
          }
        });
      });
    });
};

function buildQuery(queryTerms){
// build all the combinations of search terms
// add in words like "transfer"
  var queryText = queryTerms.query;
  var querySinceTimestamp = queryTerms.since;
  var queryUntilTimestamp = queryTerms.until;
  var searchTerms = queryText + " transfer" + " since:" + querySinceTimestamp + " until:" + queryUntilTimestamp + " AND -filter:retweets AND -filter:replies";
  return searchTerms;
}

function buildDbQuery(queryTerms){
  return queryTerms;
}

module.exports.getFromDatabase = function(queryTerms, callback){
  // extract hashtags from query and search hashtags table
  // search text of tweets for query terms
  // search players for twitter handles from query
  // search clubs for twitter handles from query
  // do this in as few queries as possible
  var dbQuery = buildDbQuery(queryTerms);

  callback(null, [{
    text: "@waynerooney in rumoured transfer talks with #TruroFC",
    tweetId: 840208454560174080,
    createdAt: new Date(2017, 3, 17, 14, 31, 20),
    hasMedia: false,
    retweetCount: 3,
    favouriteCount: 0
  }]);
}