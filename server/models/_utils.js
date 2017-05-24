'use strict';
var classifier = require('../lib/tweet_processors/TweetClassifier')
                  .getClassifier();
var moment = require('moment');

module.exports.createTwitterQuery = ({ players=[], clubs=[], authors=[], operator='AND'}) => {
  if (operator === 'AND') {
    var terms = [];

    var arrays = [];
    var SENTINAL = '';
    var addSentinal = a => a.length ? a : [SENTINAL];

    players = addSentinal(players);
    clubs = addSentinal(clubs);
    authors = addSentinal(authors);
    
    var terms = [];
    players.forEach(player => {
      clubs.forEach(club => {
        terms.push([player, club]);
      });
    });
    return terms.map(t => {
      return t.filter(l => l !== SENTINAL).join(' ');
    }).join(', ');
  } else if (operator === 'OR') {
    return [].concat(players, clubs, authors).join(', ');
  }
};

module.exports.selectTransferTweet = tweet => {
  /**
   * Uses the classifier to determine if a tweet
   * is to do with transfers or just general football.
   * @param {Object} tweet The tweet object from Twitter
   * @return {Boolean} True if the tweet is a transfer tweet,
   * false otherwise.
   */
  var threshold = 1.0;
  var probs = classifier.classify(tweet.text);
  var ratio = probs.transfers / probs.football;
  var isTransfer = ratio > threshold;
  // if(isTransfer){
  //   console.log(ratio);
  //   console.log(tweet.text);
  // }
  return isTransfer;
};

module.exports.makeTweetObject = tweet => {
  /**
   * Makes an object made up of the fields needed for the frontend.
   */
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
  /**
   * Makes a tweet object based on the database fields, 
   * in a format designed for the frontend.
   */
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
  /**
   * Makes a tweet object with just the fields for the Tweets table.
   */
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
  /**
   * Formats a date object in the way usable with Twitter's 
   * search API.
   */
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  return year + "-" + month + "-" + day;
};