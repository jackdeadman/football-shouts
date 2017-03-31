'use strict';

var T = require('twit');
var config = require('../config').twitter;
var json2csv = require('json2csv');
var fs = require('fs');

var client = new T({
  consumer_key: config.consumerKey,
  consumer_secret: config.consumerSecret,
  access_token: config.accessToken,
  access_token_secret: config.accessTokenSecret
});
// from:DeadlineDayLive OR from:JPercyTelegraph OR from:Sport_Witness


function processTweets(response){
  var tweets = response.statuses;
  tweets = tweets.map(function(tweet){
    return { "text": tweet.text };
  });

  return tweets;
}

var query = { q: 'from:ChelseaFC -filter:replies', count: 100 };

client.get('search/tweets', query, function(err, response){
  var tweets = processTweets(response);

  var query = { q: 'from:ManUtd -filter:replies', count: 100 };

  console.log(tweets.length);
  client.get('search/tweets', query, function(err, response){
    tweets = tweets.concat(processTweets(response));
    console.log(tweets.length);

    var query = { q: 'from:BBCMOTD -filter:replies', count: 100 };

    client.get('search/tweets', query, function(err, response){
      tweets = tweets.concat(processTweets(response));

      console.log(tweets.length);

      var csv = json2csv({ data: tweets, fields: ["text"] });
      fs.writeFile('footballTweets.csv', csv, function(err){
        if(err){
          throw err;
        }
        console.log('file saved');
      });
    });
  });
});

