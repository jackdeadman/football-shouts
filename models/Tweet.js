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
var Hashtag = require('./Hashtag');
var Author = require('./Author');

var client = new T({
  consumer_key: config.consumerKey,
  consumer_secret: config.consumerSecret,
  access_token: config.accessToken,
  access_token_secret: config.accessTokenSecret
});

function savePlayer(player){
  return dbPlayer.findOrCreate({
    where: {
      name: player
    }
  });
}

function saveClub(club){
  return dbClub.findOrCreate({
    where: {
      name: club
    }
  });
}

function saveAuthor(author){
  return dbAuthor.findOrCreate({
    where: {
      twitterHandle: author.twitterHandle,
    },
    defaults: {
      name: author.name,
      profileImageUrl: author.profileImageUrl
    }
  });
}

function saveTweet(tweet){
  return dbTweet.findOrCreate({
    where: {
      text: tweet.text,
      twitterId: tweet.twitterId,
      datePublished: tweet.datePublished,
      hasMedia: tweet.hasMedia,
      retweetCount: tweet.retweetCount,
      favouriteCount: tweet.favouriteCount
    }
  });
}

function saveHashtags(hashtags){
  var hashtagSaves = [];
  hashtags.forEach(function(hashtag){
    hashtagSaves.push(dbHashtag.findOrCreate({
      where: {
        hashtag: hashtag
      }
    }));
  });
  return hashtagSaves;
}

function saveToDatabase(tweet, player, club, author, hashtags){
  /**
   * Takes several related objects - and saves them to the database.
   * @param {TweetObject} tweet The tweet to be saved, 
   * made by makeTweetDbObject;
   * @param {String} player The player associated with the tweet;
   * @param {String} club The club associated with the tweet;
   * @param {AuthorObject} author The author of the tweet, 
   * made by makeAuthorObject;
   * @param {List} hashtags The list of hashtags (possibly an empty list)
   * in the tweet, made by Hashtag.processHashtags.
   * @return {Promise} Resolves when all the above are saved to the database.
   */
  var tweetSaved = saveTweet(tweet);
  var playerSaved = savePlayer(player);
  var clubSaved = saveClub(club);
  var authorSaved = saveAuthor(author);

  var everythingSaved;
  if(hashtags.length === 0){
    everythingSaved = Promise.all([
      tweetSaved,
      authorSaved,
      playerSaved,
      clubSaved
    ]);
  }else{
    var hashtagSaves = saveHashtags(hashtags);

    var hashtagsSaved = Promise.all(hashtagSaves);
    everythingSaved = Promise.all([
      tweetSaved,
      authorSaved,
      playerSaved,
      clubSaved,
      hashtagsSaved
    ]);
  }

  return everythingSaved;
}

function makeRelations(everythingSaved){
  /**
   * Makes the appropriate relations between saved objects.
   * @param {Promise} everythingSaved Produced by saveToDatabase
   * @return {Promise} Resolved when all the relations are set.
   */
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
    console.error(err);
    return Promise.reject(
      {
        message: 'problem saving the tweet, club, player, or author to db',
        err: err
      }
    );
  });
}

module.exports.getFromTwitter = function(query, callback){
  /**
   * Queries twitter based on a query object, saves tweets
   * returned to the database.
   * @param {Object} query The database query;
   * @param {String} query.player The player to search for;
   * @param {String} query.club The club to search for;
   * @param {String} query.since The timestamp to search from;
   * @param {String} query.until The timestamp to search up to.
   * @param {Function} callback To be called when Twit returns
   * tweets from Twitter.
   */

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

    var tweetList = originalTweetList.map(utils.makeTweetObject);
    tweetList = tweetList.filter(utils.selectTransferTweet);
    console.log("tweets from twitter: ",
                  tweetList.length,
                  " from this query: ",
                  twitterQuery);
    callback(null, tweetList);

    tweetList.forEach(function(tweet, i){
      var hashtags = originalTweetList[i].entities.hashtags;
      hashtags = Hashtag.processHashtags(hashtags);
      var author = Author.makeAuthorObject(tweet);
      tweet = utils.makeTweetDbObject(tweet);
      var everythingSaved = saveToDatabase(tweet,
                                            query.player,
                                            query.club,
                                            author,
                                            hashtags);
      makeRelations(everythingSaved)
      .then(() => {
        console.log("Saved tweet to db");
      });
    });
  });
};

function buildQuery(queryTerms){
  /**
   * Takes a query object and formats a string for the twitter query.
   * @param {Object} query The database query;
   * @param {String} query.player The player to search for;
   * @param {String} query.club The club to search for;
   * @param {String} query.since The timestamp to search from;
   * @param {String} query.until The timestamp to search up to.
   * @return A formatted string for searching Twitter.
   */
  var player = queryTerms.player;
  var club = queryTerms.club;
  var sinceTimestamp = utils.formatDateForTwitter(queryTerms.since);
  var untilTimestamp = utils.formatDateForTwitter(queryTerms.until);
  var timeLimits = " since:" + sinceTimestamp + " until:" + untilTimestamp;
  var filterRetweetsAndReplies = " AND -filter:retweets AND -filter:replies";
  var searchTerms = player + " " + club + timeLimits + filterRetweetsAndReplies;
  console.log("search terms:", searchTerms);
  return searchTerms;
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
  /**
   * Searches for tweets related to hashtags, players or clubs.
   * @param {String} player The player query term;
   * @param {String} club The club query term;
   * @param {String} since The timestamp to start the search at;
   * @param {String} until The timestamp to end the search at.
   * @return {Promise} Resolves when the query to MySQL returns.
   */
  since = moment(since).format().toString();
  until = moment(until).format().toString();
  var playerQuery = makePlayerOrClubQuery(player);
  var clubQuery = makePlayerOrClubQuery(club);

  if(Hashtag.isHashtag(player) && Hashtag.isHashtag(club)){
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
              $in: [Hashtag.stripHashtag(player), Hashtag.stripHashtag(club)]
            }
          }
        },
        {
          model: dbAuthor
        }
      ]
    });
  } else if(Hashtag.isHashtag(player)){
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
            hashtag: Hashtag.stripHashtag(player)
          }
        },
        {
          model: dbAuthor
        }
      ]
    });
  } else if(Hashtag.isHashtag(club)) {
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
            hashtag: Hashtag.stripHashtag(club)
          }
        },
        {
          model: dbAuthor
        }
      ]
    });
  }

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
  /**
   * Finds tweets from the database, makes objects in the same format
   * as the ones made by getFromTwitter.
   * @param {Object} query The database query;
   * @param {String} query.player The player to search for;
   * @param {String} query.club The club to search for;
   * @param {String} query.since The timestamp to search from;
   * @param {String} query.until The timestamp to search up to.
   * 
   * @param {Function} callback The function to be called when the database
   * returns data.
   */
  console.log("getting from database");

  var player = query.player;
  var club = query.club;
  var since = query.since;
  var until = query.until;

  findTweets(player, club, since, until)
  .then(tweets => {
    tweets = tweets.map(utils.makeTweetObjectFromDb);

    console.log("tweets from db length: ", tweets.length);
    callback(null, tweets);
  })
  .catch(err => {
    console.error("Can't find tweets from db.", err);
    callback(null, []);
  });
};

module.exports.live = function(query){
  /**
   * Connects to the streaming API, saves tweets coming in
   * and returns the stream object.
   * @param {Object} query The database query;
   * @param {String} query.player The player to search for;
   * @param {String} query.club The club to search for.
   * @return {LiveTweet} A Twitter Streaming API stream.
   */
  var player = query.player;
  var club = query.club;
  var queryObj = { track: player + " " + club };
  var liveTweetStream = new LiveTweet(client, 'statuses/filter', queryObj);
  liveTweetStream.on('tweet', function(tweet){
    var hashtags = Hashtag.processHashtags(tweet.entities.hashtags);
    var processedTweet = utils.makeTweetObject(tweet);
    var author = Author.makeAuthorObject(processedTweet);
    var databaseTweet = utils.makeTweetDbObject(processedTweet);
    var everythingSaved = saveToDatabase(databaseTweet,
                                      player,
                                      club,
                                      author,
                                      hashtags);
    makeRelations(everythingSaved)
    .then(() => {
      console.log("Saved live tweet");
    })
    .catch(err => {
      console.error(err);
    });
  });
  return liveTweetStream;
};
