'use strict';
var classifier = require('../lib/tweet_processors/TweetClassifier')
                  .getClassifier();

module.exports.selectTransferTweet = tweet => {
  var threshold = 1.0;
  // console.log(typeof tweet.text);
  var probs = classifier.classify(tweet.text);
  var ratio = probs.transfers / probs.football;
  var isTransfer = ratio > threshold;
  // console.log(ratio);
  if(isTransfer){
    console.log(ratio);
    console.log(tweet.text);
  }
  return isTransfer;
};