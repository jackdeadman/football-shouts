var database = require('./Database');
var T = require('twit');
var config = require('../config').twitter
var dbTweet = database.Tweet;

var client = new T({
 consumer_key: config.consumerKey,
 consumer_secret: config.consumerSecret,
 access_token: config.accessToken,
 access_token_secret: config.accessTokenSecret
});

function saveTweet(tweet){
  var text = tweet.text;
  var id = tweet.id_str;
  var createdAt = tweet.created_at;
  var retweetCount = tweet.retweet_count;
  var favouriteCount = tweet.favorite_count;
  // var hasMedia = !!tweet.entities.media;
  console.log(id);

  var tweetObject = dbTweet.build({
    text: text,
    tweetId: id,
    createdAt: createdAt,
    // hasMedia: hasMedia,
    retweetCount: retweetCount,
    favouriteCount: favouriteCount
  });

  // return tweetObject.save()
  return new Promise((resolve, reject) => {
    tweetObject.save()
    .catch(reject)
    .then(result => {
      resolve(result);
    })
  })
  // .catch(err => {
  //   console.log("saving failed");
  // })
  // .then(tweet => {
  //   return tweet;
  // });
}

module.exports.getTweets = function(queryTerms){
  var twitterQuery = buildQueries(queryTerms);

  return new Promise((resolve, reject) => {
    var tweets = client.get('search/tweets', { q: twitterQuery, count: 100 });
    tweets.then(result => {
      // console.log("in then");
      // var allQueryTweets = []
      // console.log(result['data']['statuses']);
      
      var tweets = result['data']['statuses'];
      tweets.forEach(tweet => {
        saveTweet(tweet)
        .then(tweet => {
          // console.log("saved tweet to db");
        })
        .catch(err => {
          console.error(err);
          // console.log("failed to save tweet in the db");
        });

      })
    });

    tweets.catch(err => {
      // console.log("failed to query twitter");
      reject(err);
    });

    resolve(tweets);
  });
}

function buildQueries(query){
// build all the combinations of search terms
// add in words like "transfer"
  var queryText = query.query;
  var querySinceTimestamp = query.since;
  var queryUntilTimestamp = query.until;
  var searchTerms = queryText + " transfer" + " since:" + querySinceTimestamp + " until:" + queryUntilTimestamp + " AND -filter:retweets AND -filter:replies";
  return searchTerms;
}