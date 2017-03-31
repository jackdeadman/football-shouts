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
var moment = require('moment');

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
}

function makeTweetObjectFromDb(databaseTweet){
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
}

function makeAuthorObject(tweetObject){
  var authorObject = {
    twitterHandle: tweetObject.twitterHandle,
    name: tweetObject.name,
    profileImageUrl: tweetObject.profileImageUrl
  };
  return authorObject;
}

function makeTweetDbObject(tweetObject){
  var tweetDbObject = {
    text: tweetObject.text,
    twitterId: tweetObject.twitterId,
    datePublished: tweetObject.datePublished,
    hasMedia: tweetObject.hasMedia,
    retweetCount: tweetObject.retweetCount,
    favouriteCount: tweetObject.favouriteCount
  };

  return tweetDbObject;
}

function saveTweet(tweet, player, club, author, hashtags){
  // var playerQuery = makePlayerOrClubQuery(player);
  // var clubQuery = makePlayerOrClubQuery(club);

  var savePlayer = dbPlayer.findOrCreate({
    where: {
      name: player
    }
  });

  var saveClub = dbClub.findOrCreate({
    where: {
      name: club
    }
  });

  var saveTweet = dbTweet.findOrCreate({
    where: {
      text: tweet.text,
      twitterId: tweet.twitterId,
      datePublished: tweet.datePublished,
      hasMedia: tweet.hasMedia,
      retweetCount: tweet.retweetCount,
      favouriteCount: tweet.favouriteCount
    }
  });

  var saveAuthor = dbAuthor.findOrCreate({
    where: {
      twitterHandle: author.twitterHandle,
      name: author.name,
      profileImageUrl: author.profileImageUrl
    }
  });

  var everythingSaved;
  if(hashtags.length === 0){
    everythingSaved = Promise.all([
      saveTweet,
      saveAuthor,
      savePlayer,
      saveClub
    ]);
  }else{
    var hashtagSaves = [];
    hashtags.forEach(function(hashtag){
      hashtagSaves.push(dbHashtag.findOrCreate({
        where: {
          hashtag: hashtag
        }
      }));
    });

    var hashtagsDone = Promise.all(hashtagSaves);
    everythingSaved = Promise.all([
      saveTweet,
      saveAuthor,
      savePlayer,
      saveClub,
      hashtagsDone
    ]);
  }

  return everythingSaved
  .then(results => {
    var tweetResult = results[0][0];
    var authorResult = results[1][0];
    var playerResult = results[2][0];
    var clubResult = results[3][0];

    var setAuthorRelation = tweetResult.setAuthor(authorResult);
    var setTweetRelationToPlayer = tweetResult.setPlayer(playerResult);
    var setTweetRelationToClub = tweetResult.setClub(clubResult);
    var setPlayerRelationToTweet = playerResult.addTweet(tweetResult);
    var setClubRelationToTweet = clubResult.addTweet(tweetResult);

    var allRelationsDone;
    if(results.length === 5){
      var hashtagResults = results[4][0];
      var hashtagRelations = [];
      hashtagResults.forEach(hashtag => {
        hashtagRelations.push(tweetResult.addHashtag(hashtag,
          { through: 'TweetHashtags' }
        ));
      });
      var setHashtagRelation = Promise.all(hashtagRelations);
      allRelationsDone = Promise.all([
        setAuthorRelation,
        setHashtagRelation,
        setTweetRelationToPlayer,
        setTweetRelationToClub,
        setPlayerRelationToTweet,
        setClubRelationToTweet
      ]);
    }else{
      allRelationsDone = Promise.all([
        setAuthorRelation,
        setTweetRelationToPlayer,
        setTweetRelationToClub,
        setPlayerRelationToTweet,
        setClubRelationToTweet
      ]);
    }

    return allRelationsDone;
  })
  .catch(err => {
    return Promise.reject(
      {
        message: 'problem saving the tweet, club, player, or author to db',
        err: err
      }
    );
  });
}

module.exports.getFromTwitter = function(query, callback){

  console.log("getting from twitter");
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

    var tweetList = originalTweetList.map(makeTweetObject);
    tweetList = tweetList.filter(utils.selectTransferTweet);
    callback(null, tweetList);

    tweetList.forEach(function(tweet, i){
      var hashtags = originalTweetList[i].entities.hashtags;
      if(hashtags.length){
        hashtags = hashtags.map(hashtag => hashtag.text.toLowerCase());
      }else{
        hashtags = [];
      }
      var author = makeAuthorObject(tweet);
      tweet = makeTweetDbObject(tweet);
      console.time('saving tweet');
      console.log('saving from twitter');
      saveTweet(tweet, query.player, query.club, author, hashtags)
      .then( () => {
        console.log('saved from twitter');
      });
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

function makePlayerOrClubQuery(query){
  var queryObj = {
    $or: [
      {
        twitterHandle: {
          $like: '%' + query + '%'
        }
      },
      {
        name: {
          $like: '%' + query + '%'
        }
      }
    ]
  };
  return queryObj;
}

function findTweets(player, club, since, until){
  since = moment(since).format().toString();
  until = moment(until).format().toString();
  var playerQuery = makePlayerOrClubQuery(player);
  var clubQuery = makePlayerOrClubQuery(club);

  if(isHashtag(player) && isHashtag(club)){
    return dbTweet.findAll({
      where: {
        datePublished: {
          $gte: since,
          $lte: until
        }
      },
      include: [
        {
          model: dbHashtag,
          as: 'Hashtags',
          where: {
            hashtag: {
              $in: [stripHashtag(player), stripHashtag(club)]
            }
          }
        },
        {
          model: dbAuthor
        }
      ]
    });
  } else if(isHashtag(player)){
    return dbTweet.findAll({
      where: {
        datePublished: {
          $gte: since,
          $lte: until
        }
      },
      include: [
        {
          model: dbClub,
          where: clubQuery,
          foreignKey: 'transferClubId'
        },
        {
          model: dbHashtag,
          as: 'Hashtags',
          where: {
            hashtag: stripHashtag(player)
          }
        },
        {
          model: dbAuthor
        }
      ]
    });
  } else if(isHashtag(club)) {
    return dbTweet.findAll({
      where: {
        datePublished: {
          $gte: since,
          $lte: until
        }
      },
      include: [
        {
          model: dbPlayer,
          where: playerQuery
        },
        {
          model: dbHashtag,
          as: 'Hashtags',
          where: {
            hashtag: stripHashtag(club)
          }
        },
        {
          model: dbAuthor
        }
      ]
    });
  }
  console.log("no hashtags");

  return dbTweet.findAll({
    where: {
      datePublished: {
        $gte: since,
        $lte: until
      }
    },
    include: [
      {
        model: dbPlayer,
        where: playerQuery
      },
      {
        model: dbClub,
        where: clubQuery,
        foreignKey: 'transferClubId'
      },
      {
        model: dbAuthor
      }
    ]
  });
}

module.exports.getFromDatabase = function(query, callback){
  console.log("getting from database");

  var player = query.player;
  var club = query.club;
  var since = query.since;
  var until = query.until;

  findTweets(player, club, since, until)
  .then(tweets => {

    tweets = tweets.map(makeTweetObjectFromDb);
    // makeTweetAndAuthorObjects(tweets)
    // .then(formattedTweets => {
      // formattedTweets = formattedTweets.concat([{
      //   text: "@waynerooney in rumoured transfer talks with #TruroFC",
      //   twitterId: 840208454560174080,
      //   datePublished: new Date(2016, 1, 17, 14, 31, 20),
      //   hasMedia: false,
      //   retweetCount: 3,
      //   favouriteCount: 0,
      //   twitterHandle: "@test",
      //   name: "T User"
      // }]);
    console.log("tweets from db length: ", tweets.length);
    callback(null, tweets);
    // });

  })
  .catch(err => {
    console.error("Can't find tweets from db.", err);
    callback(null, []);
  });
};

module.exports.live = function(query){
  var player = query.player;
  var club = query.club;
  var queryObj = { track: player + " " + club };
  var liveTweetStream = new LiveTweet(client, 'statuses/filter', queryObj);  
  return liveTweetStream;
};
