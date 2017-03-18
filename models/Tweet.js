'use strict';

var database = require('./Database');
var T = require('twit');
var config = require('../config').twitter;
var dbTweet = database.Tweet;
var dbAuthor = database.Author;
var LiveTweet = require('./LiveTweet');

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
    favouriteCount: tweet.favorite_count,
    authorHandle: tweet.user.screen_name,
    authorName: tweet.user.name
  };

  return tweetObject;
}

function makeAuthorObject(tweetObject){
  var authorObject = {
    authorHandle: tweetObject.authorHandle,
    authorName: tweetObject.authorName
  }
  return authorObject;
}

function makeTweetDbObject(tweetObject){
  var tweetDbObject = {
    text: tweetObject.text,
    tweetId: tweetObject.tweetId,
    createdAt: tweetObject.createdAt,
    hasMedia: tweetObject.hasMedia,
    retweetCount: tweetObject.retweetCount,
    favouriteCount: tweetObject.favouriteCount
  }

  return tweetDbObject;
}

function saveTweet(tweet, author){
  var tweetObject = dbTweet.build(tweet);
  var authorDbObject = dbAuthor.build(author);
  tweetObject.save().then(function(tweet){
    authorDbObject.save().then(function(author){
      tweet.setAuthor(author);
    });
  });
}

module.exports.getFromTwitter = function(query, callback){
  var twitterQuery = buildQuery(query);
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
      saveTweet(makeTweetDbObject(tweet), makeAuthorObject(tweet), function(err){
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
  var player = queryTerms.player;
  var club = queryTerms.club;
  var sinceTimestamp = queryTerms.since;
  var untilTimestamp = queryTerms.until;
  var searchTerms = player + " transfer " + club + " since:" + sinceTimestamp + " until:" + untilTimestamp + " AND -filter:retweets AND -filter:replies";
  return searchTerms;
}
/*
function buildDbQuery(queryTerms){
  return queryTerms;
}*/

module.exports.getFromDatabase = function(queryTerms, callback){
  // extract hashtags from query and search hashtags table
  // search text of tweets for query terms
  // search players for twitter handles from query
  // search clubs for twitter handles from query
  // do this in as few queries as possible
  // var dbQuery = buildDbQuery(queryTerms);

  callback(null, [{
    text: "@waynerooney in rumoured transfer talks with #TruroFC",
    tweetId: 840208454560174080,
    createdAt: new Date(2017, 2, 17, 14, 31, 20),
    hasMedia: false,
    retweetCount: 3,
    favouriteCount: 0
  }]);
}

module.exports.live = function(query){
  var player = query.player;
  var club = query.club;
  var queryObj = { track: player + " transfer " + club };
  var liveTweetStream = new LiveTweet(client, 'statuses/filter', queryObj);
  return liveTweetStream;
}
