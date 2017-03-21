'use strict';

var database = require('./Database');
var T = require('twit');
var config = require('../config').twitter;
var dbTweet = database.Tweet;
var dbAuthor = database.Author;
var LiveTweet = require('./LiveTweet');
var dbPlayer = database.Player;
var dbClub = database.Club;

var classifier = require('../lib/tweet_processors/TweetClassifier')
                  .getClassifier();

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
  };
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
  };

  return tweetDbObject;
}

function saveTweet(tweet, author){
  dbTweet.findOrCreate({
    where: {
      text: tweet.text,
      tweetId: tweet.tweetId,
      createdAt: tweet.createdAt,
      hasMedia: tweet.hasMedia,
      retweetCount: tweet.retweetCount,
      favouriteCount: tweet.favouriteCount
    }
  })
  .then(function(tweetResult){
    dbAuthor.findOrCreate({
      where: {
        authorHandle: author.authorHandle,
        authorName: author.authorName
      }
    })
    .then(function(authorResult){
      tweetResult[0].setAuthor(authorResult[0]);
    })
    .catch(function(err){
      console.error("Can't save author: ", err);
    });
  })
  .catch(function(err){
    console.error("Can't save tweet: ", err);
  });
}

function selectTransferTweet(tweet){
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
}

module.exports.getFromTwitter = function(query, callback){
  // console.log("query: ", query);
  var twitterQuery = buildQuery(query);
  var fullQuery = { 
    q: twitterQuery, 
    count: 100, 
    result_type: "mixed", 
    lang: "en" 
  };

  client.get('search/tweets', fullQuery, function(err, queryResult){
    if(err){
      console.error("failed to get tweets from twitter");
      callback(err);
      return;
    }

    var tweetList = queryResult.statuses;
    console.log(tweetList.length);
    // need to save hashtags to a different table probably

    tweetList = tweetList.map(makeTweetObject);
    tweetList = tweetList.filter(selectTransferTweet);
    console.log(tweetList.length);
    callback(null, tweetList);

    tweetList.forEach(function(tweet){
      var author = makeAuthorObject(tweet);
      tweet = makeTweetDbObject(tweet);
      try{
        saveTweet(tweet, author, function(err){
          if(err){
            console.error("error saving to db");
            // may be able to recover from some errors
            return;
          }
        });
      } catch (validationError) {
        console.error(validationError);
      }
      
    });
  });
};

function formatDate(date){
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  return year + "-" + month + "-" + day;
}

function buildQuery(queryTerms){
// build all the combinations of search terms
// add in words like "transfer"
  var player = queryTerms.player;
  var club = queryTerms.club;
  // var sinceTimestamp = formatDate(queryTerms.since);
  var untilTimestamp = formatDate(queryTerms.until);
  var searchTerms = player + " " 
                    + club 
                    // + "since:"
                    // + sinceTimestamp
                    + " until:" 
                    + untilTimestamp 
                    + " AND -filter:retweets AND -filter:replies";
  console.log("search terms:", searchTerms);
  return searchTerms;
}
/*
function buildDbQuery(queryTerms){
  return queryTerms;
}*/

function findPlayers(playerQuery){
  return dbPlayer.findAll({
    where: {
      $or: [
        {
          twitterHandle: {
            $like: '%' + playerQuery + '%'
          }
        },
        {
          name: {
            $like: '%' + playerQuery + '%'
          }
        }
      ]
    }
  });
}

function findTweetsForPlayers(players){
  var playerTweets = [];
  players.forEach(function(player){
    playerTweets.push(player.getTweets());
  });
  return playerTweets;
}

function findClubs(clubQuery){
  return dbClub.findAll({
    where: {
      $or: [
        {
          twitterHandle: {
            $like: '%' + clubQuery + '%'
          }
        },
        {
          name: {
            $like: '%' + clubQuery + '%'
          }
        }
      ]
    }
  });
}

function findTweetsForClubs(clubs){
  var clubTweets = [];
  clubs.forEach(function(club){
    clubTweets.push(club.getTweets());
  });
  return clubTweets;
}

module.exports.getFromDatabase = function(query, callback){
  // extract hashtags from query and search hashtags table
  // search text of tweets for query terms
  // search players for twitter handles from query
  // search clubs for twitter handles from query
  // do this in as few queries as possible

  // var testPlayer = {
  //   name: "Jack Deadman",
  //   twitterHandle: "jackdeadman96"
  // };

  // var testPlayerQuery = "jackdeadman96";

  // var testClub = {
  //   name: "Garrison Gunners",
  //   twitterHandle: "IOS_WSL"
  // };

  // var testClubQuery = "Garrison Gunners";

  var player = query.player;
  var club = query.club;
  // var since = query.since;
  // var until = query.until;

  var tweets = [];

  findPlayers(player)
  .then(function(players){
    var playerTweets = findTweetsForPlayers(players);
    findClubs(club)
    .then(function(clubs){
      var clubTweets = findTweetsForClubs(clubs);
      tweets = playerTweets.concat(clubTweets);
    });
  });

  // still adding in dummy tweet as no players or clubs have tweets linked
  tweets = tweets.concat([{
    text: "@waynerooney in rumoured transfer talks with #TruroFC",
    tweetId: 840208454560174080,
    createdAt: new Date(2017, 2, 17, 14, 31, 20),
    hasMedia: false,
    retweetCount: 3,
    favouriteCount: 0
  }]);

  callback(null, tweets);
};

module.exports.live = function(query){
  var player = query.player;
  var club = query.club;
  var queryObj = { track: player + " transfer " + club };
  var liveTweetStream = new LiveTweet(client, 'statuses/filter', queryObj);
  return liveTweetStream;
};
