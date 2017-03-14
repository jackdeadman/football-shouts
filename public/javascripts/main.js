function handleSearchError(err) {
  // TODO: Add error handling
  alert('Error');
  console.log(err);
}

function displaySearchResults(results) {
  // TODO: Do fancy stuff here
  if (results.tweets.length) {
      alert(results.tweets[0].text)
  }
}


(function(io) {
  // Connections
  var suggestions = io('/suggestions');
  var search = io('/search');
  var liveTweets = io('/liveTweets');

  // Setup Socket listeners
  search.on('error', handleSearchError);
  search.on('result', displaySearchResults);

  // Send some data to the server to test
  var req = { player: 'Wayne', club: 'Brighton' };
  search.emit('query', req);


  liveTweets.on('tweet', function(tweet) {
    console.log(tweet);
  });

  liveTweets.emit('subscribe', {
    path: 'statuses/filter',
    filter: { track: 'mango' }
  });

})(io);
