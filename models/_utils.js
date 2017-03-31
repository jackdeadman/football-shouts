'use strict';
var classifier = require('../lib/tweet_processors/TweetClassifier')
                  .getClassifier();
var moment = require('moment');

module.exports.selectTransferTweet = tweet => {
  var threshold = 1.0;
  var probs = classifier.classify(tweet.text);
  var ratio = probs.transfers / probs.football;
  var isTransfer = ratio > threshold;
  if(isTransfer){
    console.log(ratio);
    console.log(tweet.text);
  }
  return isTransfer;
};

module.exports.makeTweetObject = tweet => {
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
};

module.exports.makeTweetObjectFromDb = databaseTweet => {
  var tweetObject = {
    text: databaseTweet.text,
    twitterId: databaseTweet.twitterId,
    datePublished: databaseTweet.datePublished,
    hasMedia: databaseTweet.hasMedia,
    retweetCount: databaseTweet.retweetCount,
    favouriteCount: databaseTweet.favouriteCount,
    updatedAt: databaseTweet.updatedAt,
    name: databaseTweet.Author.name,
    twitterHandle: databaseTweet.Author.twitterHandle,
    profileImageUrl: databaseTweet.Author.profileImageUrl
  };
  return tweetObject;
};

module.exports.makeTweetDbObject = tweetObject => {
  var tweetDbObject = {
    text: tweetObject.text,
    twitterId: tweetObject.twitterId,
    datePublished: tweetObject.datePublished,
    hasMedia: tweetObject.hasMedia,
    retweetCount: tweetObject.retweetCount,
    favouriteCount: tweetObject.favouriteCount
  };

  return tweetDbObject;
};

module.exports.formatDateForTwitter = date => {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  return year + "-" + month + "-" + day;
};