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
  var hasMedia = false;
  if(tweet.entities.media){
    var hasMedia = true;
  }

  var tweet = dbTweet.build({
    text: text,
    tweetId: id,
    createdAt: createdAt,
    hasMedia: hasMedia,
    retweetCount: retweetCount,
    favouriteCount: favouriteCount
  });

  tweet.save()
  .catch(function(err){
    console.log("saving failed!");
  })
  .then(function(){
    console.log("saved tweet");
  });
}

module.exports.getTweets = function(queryTerms){
  twitterQueries = buildQueries(queryTerms);

  var queryPromises = []
  for(var i = 0; i < twitterQueries.length; i++){
    console.log(twitterQueries[i]);    
    var query = client.get('search/tweets', { q: twitterQueries[i], count: 100 });
    queryPromises.push(query);
  }

  Promise.all(queryPromises)
  .catch(err => {
      console.log("Error searching for ", twitterQueries[i]);
  })
  .then(result => {
    console.log("query number: ", result.length);
    for(var queryIndex = 0; queryIndex < result.length; queryIndex++){
      var tweets = result[queryIndex]['data']['statuses'];
      console.log("tweet number: ", tweets.length);
      for(var tweetIndex = 0; tweetIndex < tweets.length; tweetIndex++){
        saveTweet(tweets[tweetIndex]);
      }
      
    }
  });
}

function buildQueries(queryTerms){
// build all the combinations of search terms
// add in words like "transfer"
  searchTerms = []
  for(var i = 0; i < queryTerms.length; i++){
    searchTerms.push(queryTerms[i] + " transfer AND -filter:retweets AND -filter:replies");
  }
  return searchTerms;
}