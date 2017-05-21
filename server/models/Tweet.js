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
var dbpediaClient = require('dbpediaclient');

dbpediaClient.replyFormat('application/json');

var client = new T({
  consumer_key: config.consumerKey,
  consumer_secret: config.consumerSecret,
  access_token: config.accessToken,
  access_token_secret: config.accessTokenSecret
});

function findPlayerMetadata(player){
  return new Promise((resolve, reject) => {
    dbpediaClient.keywordSearch(player, "soccer player", function (results) {
      results = JSON.parse(results);
      var name = player;
      if (results.results.length > 0) {
        name = results.results[0].label;
        console.log("name: #####", name);
      }
      
      resolve(name);
    });
  });
 
}

function savePlayer(player){
  return new Promise((resolve, reject) => {
    findPlayerMetadata(player).then((dbpediaName) => {
      resolve(dbPlayer.findOrCreate({
        where: {
          name: dbpediaName
        }
      }));
    });
  });

}

function findClubMetadata(club){
  return new Promise((resolve, reject) => {
    dbpediaClient.keywordSearch(club, "soccer club", function (results) {
      results = JSON.parse(results);
      var name = club;
      if (results.results.length > 0) {
        name = results.results[0].label;
        console.log("club: #####", name);
      }
      
      resolve(name);
    });
  });
}

function saveClub(club){
  return new Promise((resolve, reject) => {
    findClubMetadata(club).then((dbpediaName) => {
      resolve(dbClub.findOrCreate({
        where: {
          name: dbpediaName
        }
      }));
    });
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
  hashtags.forEach((hashtag) => {
    hashtagSaves.push(new Promise((resolve, reject) => {
      var hashtagSave = dbHashtag.findOrCreate({
        where: {
          hashtag: hashtag
        }
      });
      hashtagSave.catch((err) => {
        reject({err, hashtag});
      });
      resolve(hashtagSave);
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
  var everything = [];
  var tweetSaved = saveTweet(tweet);
  everything.push(tweetSaved);

  var authorSaved = saveAuthor(author);
  everything.push(authorSaved);

  if (player !== "") {
    var playerSaved = savePlayer(player);
    everything.push(playerSaved);
  }
  if (club !== "") {
    var clubSaved = saveClub(club);
    everything.push(clubSaved);
  }

  if (hashtags.length !== 0) {
    var hashtagSaves = saveHashtags(hashtags);
    var hashtagsSaved = Promise.all(hashtagSaves);
    everything.push(hashtagsSaved);
    // console.log("pushed hashtags");
  }

  var everythingSaved = Promise.all(everything);

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
    var allRelations = [];

    var tweetResult = results[0][0];
    var authorResult = results[1][0];

    if (results.length > 2) {
      var playerResult = results[2][0];
      var clubResult = results[3][0];

      var setTweetRelationToPlayer = tweetResult.setPlayer(playerResult);
      var setTweetRelationToClub = tweetResult.setClub(clubResult);
      var setPlayerRelationToTweet = playerResult.addTweet(tweetResult);
      var setClubRelationToTweet = clubResult.addTweet(tweetResult);
      allRelations.push(setTweetRelationToPlayer, setTweetRelationToClub, 
                        setPlayerRelationToTweet, setClubRelationToTweet);
    }
    
    var setAuthorRelation = tweetResult.setAuthor(authorResult);
    allRelations.push(setAuthorRelation);

    var allRelationsDone;
    if(results.length === 5){
      var hashtagResults = results[4].map(result => result[0]);
      var hashtagRelations = [];
      hashtagResults.forEach(hashtag => {
        // hashtag = hashtag.get({
        //   plain: true
        // });
        hashtagRelations.push(new Promise((resolve, reject) => {
          var setRelation = tweetResult.addHashtag(hashtag, {
            through: { hashtagId: hashtag.id, tweetId: tweetResult.id }
          });
          setRelation
          .catch((err) => {
            console.log("#####", hashtag);
            reject({err, hashtag});
          });
          resolve(setRelation);
        })); // { through: 'TweetHashtags' }
      });
      var setHashtagRelation = Promise.all(hashtagRelations);
      allRelations.push(setHashtagRelation);
    }
    allRelationsDone = Promise.all(allRelations);
    // allRelationsDone.catch((err) => {
    //   console.log(results);
    // });

    return allRelationsDone;
  })
  .catch(err => {
    // console.error(err.message);
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
   * @param {String} query.operator Operator between player and club;
   * @param {String} query.club The club to search for;
   * @param {String} query.authors The authors to filter by;
   * @param {String} query.since The timestamp to search from;
   * @param {String} query.until The timestamp to search up to.
   * @param {Function} callback To be called when Twit returns
   * tweets from Twitter.
   */

  query.player = query.player || '';
  query.club = query.club || '';
  query.authors = query.authors.length ? query.authors : [];
  query.operator = query.operator || 'OR'

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
   * @param {String} query.operator Operator between player and club 
   * @param {String} query.club The club to search for;
   * @param {String} query.authors The author to filter by;
   * @param {String} query.since The timestamp to search from;
   * @param {String} query.until The timestamp to search up to.
   * @return A formatted string for searching Twitter.
   */
  var player = queryTerms.player;
  var club = queryTerms.club;
  var operator = queryTerms.operator;
  var authors = queryTerms.authors.map(Hashtag.stripHashtag);
  var sinceTimestamp = utils.formatDateForTwitter(queryTerms.since);
  var untilTimestamp = utils.formatDateForTwitter(queryTerms.until);
  var timeLimits = " since:" + sinceTimestamp + " until:" + untilTimestamp;
  var filterRetweetsAndReplies = " AND -filter:retweets AND -filter:replies";
  var authorFilter = authors.map(a => `from:${a}`).join(' OR ');
  var playerAndClub = [player, club].filter(term => term !== "").join(` ${operator} `);
  var playerClubAuthorString = `(${playerAndClub}) ${authorFilter}`;

  var searchTerms = playerClubAuthorString + timeLimits + filterRetweetsAndReplies;
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

function findTweets(player, operator, club, authors, since, until){
  /**
   * Searches for tweets related to hashtags, players or clubs.
   * @param {String} player The player query term;
   * @param {String} operator Operator between player and club;
   * @param {String} club The club query term;
   * @param {String} authors The authors query term;
   * @param {String} since The timestamp to start the search at;
   * @param {String} until The timestamp to end the search at.
   * @return {Promise} Resolves when the query to MySQL returns.
   */

  if (operator === 'OR') {
    operator = '$or';
  } else if (operator === 'AND') {
    operator = '$and';
  } else {
    // Handle Error
    throw new Error(`Invalid operator supplied: ${operator}`);
  }

  since = moment(since).format().toString();
  until = moment(until).format().toString();

  var playerMetadataFound = findPlayerMetadata(player);
  var clubMetadataFound = findClubMetadata(club);

  return Promise.all([playerMetadataFound, clubMetadataFound]).then((playerAndClub) => {
    console.log(playerAndClub);
    var [playerName, clubName] = playerAndClub;
    var playerQuery = makePlayerOrClubQuery(playerName);
    var clubQuery = makePlayerOrClubQuery(clubName);

    // TODO: Currently a hack, the function should be renamed
    authors = authors.map(Hashtag.stripHashtag);
    // var authorQuery = makePlayerOrClubQuery(authors);
    var authorQuery = {};
    if (authors.length) {
      authorQuery = {
        $or: [
          {
            twitterHandle: {
              $in: authors
            }
          },
          {
            name: {
              $in: authors
            }
          }
        ]
      };
    }

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
            model: dbAuthor,
            where: authorQuery
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
            model: dbAuthor,
            where: authorQuery
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
            model: dbAuthor,
            where: authorQuery
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
          model: dbAuthor, 
          where: authorQuery
        }
      ]
    });
  });
  
}

module.exports.getFromDatabase = function(query, callback){
  /**
   * Finds tweets from the database, makes objects in the same format
   * as the ones made by getFromTwitter.
   * @param {Object} query The database query;
   * @param {String} query.player The player to search for;
   * @param {String} query.operator Operator between player and club;
   * @param {String} query.club The club to search for;
   * @param {String} query.author The author to filter by;
   * @param {String} query.since The timestamp to search from;
   * @param {String} query.until The timestamp to search up to.
   * 
   * @param {Function} callback The function to be called when the database
   * returns data.
   */
  console.log("getting from database");

  var player = query.player === undefined ? "" : query.player;
  var club = query.club === undefined ? "" : query.club;
  var authors = query.authors === undefined ? [] : query.authors;
  var operator = query.operator;
  var since = query.since;
  var until = query.until;

  findTweets(player, operator, club, authors, since, until)
  .then(tweets => {
    tweets = tweets.map(utils.makeTweetObjectFromDb);

    console.log("tweets from db length: ", tweets.length);
    callback(null, tweets);
  })
  .catch(err => {
    console.error("Can't find tweets from db.");
    callback(null, []);
  });
};

module.exports.live = function(query){
  /**
   * Connects to the streaming API, saves tweets coming in
   * and returns the stream object.
   * @param {Object} query The database query;
   * @param {String} query.players The players to search for;
   * @param {String} query.clubs The clubs to search for.
   * @return {LiveTweet} A Twitter Streaming API stream.
   */
  var players = query.players;
  var clubs = query.clubs;
  console.log(players, clubs);
  console.log('TRACKING: ', utils.createTwitterQuery({players, clubs}));

  var queryObj = { track: utils.createTwitterQuery({players, clubs}) };

  var liveTweetStream = new LiveTweet(client, 'statuses/filter', queryObj);
  liveTweetStream.on('tweet', tweet => {
    console.log('New tweet: xsmkmkxmxks');
    var hashtags = Hashtag.processHashtags(tweet.entities.hashtags);
    var processedTweet = utils.makeTweetObject(tweet);
    var author = Author.makeAuthorObject(processedTweet);
    var databaseTweet = utils.makeTweetDbObject(processedTweet);
    
    players.forEach(player => {
      clubs.forEach(club => {
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
    });
  });
  return liveTweetStream;
};
