apply = require('../utils/helpers').apply;

function findTransfers(player, club) {
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

    io.on('connection', function(socket) {
      console.log('connected.');
      socket.on('search', apply(handleSearch, socket));
      socket.on('reqPlayerSuggestion', apply(handleReqPlayerSuggestion, socket));
    });
  }
}
