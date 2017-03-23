'use strict';

var database = require('./Database');
var T = require('twit');
var config = require('../config').twitter;
var dbTweet = database.Tweet;
var dbAuthor = database.Author;
var LiveTweet = require('./LiveTweet');
var dbPlayer = database.Player;
var dbClub = database.Club;
var dbHashtag = database.Hashtag;
var utils = require('./_utils');

var client = new T({
  consumer_key: config.consumerKey,
  consumer_secret: config.consumerSecret,
  access_token: config.accessToken,
  access_token_secret: config.accessTokenSecret
});

function makeTweetObject(tweet){
  var tweetObject = {
    text: tweet.text,
    twitterId: tweet.id_str,
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
    twitterId: tweetObject.twitterId,
    createdAt: tweetObject.createdAt,
    hasMedia: tweetObject.hasMedia,
    retweetCount: tweetObject.retweetCount,
    favouriteCount: tweetObject.favouriteCount
  };

  return tweetDbObject;
}

function saveTweet(tweet, author, hashtags){
  var hashtagSaves = [];
  hashtags.forEach(function(hashtag){
    hashtagSaves.push(dbHashtag.findOrCreate({
      where: {
        hashtag: hashtag
      }
    }));
  });

  var hashtagsDone = Promise.all(hashtagSaves);

  // need to make associated tweethashtags and then associate them to tweets.

  var saveTweet = dbTweet.findOrCreate({
    where: {
      text: tweet.text,
      twitterId: tweet.twitterId,
      createdAt: tweet.createdAt,
      hasMedia: tweet.hasMedia,
      retweetCount: tweet.retweetCount,
      favouriteCount: tweet.favouriteCount
    }
  });

  var saveAuthor = dbAuthor.findOrCreate({
    where: {
      authorHandle: author.authorHandle,
      authorName: author.authorName
    }
  });

  Promise.all([saveTweet, saveAuthor, hashtagsDone])
  .then(results => {
    var tweetResult = results[0][0];
    var authorResult = results[1][0];
    var hashtagResults = results[2][0];
    var setAuthorRelation = tweetResult.setAuthor(authorResult);
    var hashtagRelations = [];
    hashtagResults.forEach(hashtag => {
      hashtagRelations.push(tweetResult.addHashtag(hashtag,
        { through: 'TweetHashtags' }
      ));
    });
    var setHashtagRelation = Promise.all(hashtagRelations);
    return Promise.all([setAuthorRelation, setHashtagRelation]);
  })
  // saveTweet
  // .then(saveAuthor)
  // .then(hashtagsDone)
  // .then(results => {
  //   console.log('#######', results[1]);
  //   var tweetResult = results[0][0];
  //   var authorResult = results[1][0];
  //   var hashtagResults = results[2][0];
  //   var setAuthorRelation = tweetResult.setAuthor(authorResult);
  //   var setHashtagRelation = tweetResult.setHashtags(hashtagResults);
  //   return Promise.all([setAuthorRelation, setHashtagRelation]);
  //   // TODO: find player, set relation
  //   // TODO: find club, set relation
  // })
  .catch(err => {
    console.error("problem with saving tweet: ", err);
  });
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

    var originalTweetList = queryResult.statuses;
    console.log(originalTweetList.length);
    // need to save hashtags to a different table probably

    var tweetList = originalTweetList.map(makeTweetObject);
    tweetList = tweetList.filter(utils.selectTransferTweet);
    console.log(tweetList.length);
    callback(null, tweetList);

    tweetList.forEach(function(tweet, i){

      // var hashtags = tweet.entities.hashtags;
      var hashtags = originalTweetList[i].entities.hashtags;
      if(hashtags.length){
        hashtags = hashtags.map(hashtag => hashtag.text.toLowerCase());
      }else{
        hashtags = [];
      }
      var author = makeAuthorObject(tweet);
      // console.log("###", author);
      tweet = makeTweetDbObject(tweet);
      saveTweet(tweet, author, hashtags, function(err){
        if(err){
          console.error("error saving to db");
          // may be able to recover from some errors
          return;
        }
      });
      // .then(() => {
      //   database.sequelize.sync();
      // });
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
  var sinceTimestamp = formatDate(queryTerms.since);
  var untilTimestamp = formatDate(queryTerms.until);
  var searchTerms = player + " "
                    + club
                    + " since:"
                    + sinceTimestamp
                    + " until:"
                    + untilTimestamp
                    + " AND -filter:retweets AND -filter:replies";
  console.log("search terms:", searchTerms);
  return searchTerms;
}


function isHashtag(string){
  return string.lastIndexOf('#', 0) === 0;
}

function stripHashtag(string){
  return string.substring(1,string.length);
}

function findTweets(player, club){
  var playerQuery = {
    $or: [
      {
        twitterHandle: {
          $like: '%' + player + '%'
        }
      },
      {
        name: {
          $like: '%' + player + '%'
        }
      }
    ]
  };

  var clubQuery = {
    $or: [
      {
        twitterHandle: {
          $like: '%' + club + '%'
        }
      },
      {
        name: {
          $like: '%' + club + '%'
        }
      }
    ]
  };
  
  if(isHashtag(player) && isHashtag(club)){
    return dbTweet.findAll({
      include: [
        {
          model: dbHashtag,
          as: 'Hashtags',
          where: {
            hashtag: {
              $in: [stripHashtag(player), stripHashtag(club)]
            }
          }
        }
      ]
    });
  } else if(isHashtag(player)){
    return dbTweet.findAll({
      include: [
        {
          model: dbClub,
          where: clubQuery
        },
        {
          model: dbHashtag,
          as: 'Hashtags',
          where: {
            hashtag: player
          }
        }
      ]
    });
  } else if(isHashtag(club)) {
    return dbTweet.findAll({
      include: [
        {
          model: dbPlayer,
          where: playerQuery
        },
        {
          model: dbHashtag,
          as: 'Hashtags',
          where: {
            hashtag: club
          }
        }
      ]
    });
  }

  return dbTweet.findAll({
    include: [
      {
        model: dbPlayer,
        where: playerQuery
      },
      {
        model: dbClub,
        where: clubQuery
      }
    ]
  });
}

module.exports.getFromDatabase = function(query, callback){
  // extract hashtags from query and search hashtags table
  // search text of tweets for query terms
  // search players for twitter handles from query
  // search clubs for twitter handles from query
  // do this in as few queries as possible

  var player = query.player;
  var club = query.club;

  // var since = query.since;
  // var until = query.until;

  findTweets(player, club)
  .then(tweets => {
     // still adding in dummy tweet as no players or clubs have tweets linked
    tweets = tweets.concat([{
      text: "@waynerooney in rumoured transfer talks with #TruroFC",
      twitterId: 840208454560174080,
      createdAt: new Date(2016, 1, 17, 14, 31, 20),
      hasMedia: false,
      retweetCount: 3,
      favouriteCount: 0
    }]);

    callback(null, tweets);
  });
};

module.exports.live = function(query){
  var player = query.player;
  var club = query.club;
  var queryObj = { track: player + " " + club };
  var liveTweetStream = new LiveTweet(client, 'statuses/filter', queryObj);
  return liveTweetStream;
};
