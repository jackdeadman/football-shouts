'use strict';

var database = require('./Database');
var T = require('twit');
var config = require('../config').twitter
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

module.exports.getTweets = function(queryTerms, callback){
  var twitterQuery = buildQueries(queryTerms);

    client.get('search/tweets', { q: twitterQuery, count: 10, result_type: "popular" }, function(err, queryResult){
      if(err){
        console.error("failed to get tweets from twitter");
        callback(err);
        return;
      }

      var tweetList = queryResult.statuses;
      
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
}

function buildQueries(query){
// build all the combinations of search terms
// add in words like "transfer"
  var queryText = query.query;
  var querySinceTimestamp = query.since;
  var queryUntilTimestamp = query.until;
  var searchTerms = queryText + " transfer" + " since:" + querySinceTimestamp + " until:" + queryUntilTimestamp + " AND -filter:retweets AND -filter:replies";
  return searchTerms;
}