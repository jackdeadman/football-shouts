'use strict';

var apply = require('../utils/helpers').apply;
var T = require('twit');
var config = require('../config').twitter
var Tweet = require('../models/Tweet');

var client = new T({
 consumer_key: config.consumerKey,
 consumer_secret: config.consumerSecret,
 access_token: config.accessToken,
 access_token_secret: config.accessTokenSecret
});

// Models
var database = require('../models/Database');

function findTransfers(player, club) {
  Tweet.getFromTwitter({ query: "trump", since: "2016-03-10", until: "2017-03-17" }, function(err, tweets){
    if(err){
      console.error("query failed");
      return;
    }
    console.log("query succeeded with: ", tweets);
  });

  var results = {
    tweets: [
      { text: 'OMG WAYNE ROONEY IS GOING 2 BRIGHTON' }
    ]
  };
  return results;
}

function handleSearch(socket, req) {
  if (req && req.player && req.club) {
    var results = findTransfers(req.player && req.club);
    socket.emit('searchResult', results);
  } else {
    console.log('ERRRROR');
    console.log(req);
    socket.emit('searchError', {
      errorMessage: 'Please provide a player and a club name.',
      obj: req
    });
  }
}

function handleReqPlayerSuggestion(socket, req) {
  var suggestions;
  if (req && req.player) {
    suggestions = Player.fuzzyFind({
      player: req.player,
      count: 10
    });
  } else {
    suggestions = [];
  }

  return { suggestions: suggestions };
}
/*
function handleReqClubSuggestion(req) {
  var suggestions;
  if (req && req.club) {
    suggestions = Club.fuzzyFind({
      club: req.club,
      count: 10
    });
  } else {
    suggestions = [];
  }

  return { suggestions: suggestions };
}
*/
module.exports = {
  listen: function(server) {
    var io = require('socket.io')(server);

    // database.Author.findAll()
    //   .then(function(authors) {
    //     console.log(authors);
    //   });

    io.of('suggestions')
      .on('connection', function(socket) {
        socket.on('reqPlayerSuggestion', apply(handleReqPlayerSuggestion, socket));
        socket.on('reqPlayerSuggestion', apply(handleReqPlayerSuggestion, socket));
      });

    io.of('search')
      .on('connection', function(socket) {
        socket.on('query', apply(handleSearch, socket));
    });

    io.of('liveTweets')
      .on('connection', function(socket) {
        socket.on('subscribe', function (req) {
          console.log('subscribed');
          var path = req.path;
          var filter = req.filter;
          // Need to add security checks here
          var stream = client.stream(path, filter);
          
          stream.on('tweet', function(tweet) {
            console.log('I HAZ TWEET');
            // Obviously will add checks here lol
            socket.emit('tweet', tweet);
          });
        });
    });
  }
}
