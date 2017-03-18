function handleSearchError(err) {
  // TODO: Add error handling
  alert('Error');
  console.log(err);
}

function displaySearchResults(node, results) {
  // TODO: Do fancy stuff here
  // if (results.tweets.length) {
  //     alert(results.tweets[0].text)
  // }
  console.log(results)
  results.forEach(function(result) {
    var div = document.createElement('div');
    div.innerHTML = result.text;
    console.log(div);
    node.appendChild(div);
  });
}


(function(io) {
  // Connections
  var suggestions = io('/suggestions');
  var search = io('/search');
  var liveTweets = io('/liveTweets');

  // Setup Socket listeners
  search.on('error', handleSearchError);

  // Send some data to the server to test
  var req = { players: ['Wayne Rooney', '@waynerooney'], clubs: ['Brighton', '@brighton'] };
  search.emit('query', req);


  // liveTweets.on('tweet', function(tweet) {
  //   console.log(tweet);
  // });

  // liveTweets.emit('subscribe', {
  //   path: 'statuses/filter',
  //   filter: { track: 'mango' }
  // });


  var app = document.getElementById('app');
  search.on('result', function(results) {
    console.log(results);
    displaySearchResults(app, results.tweets);
  });


})(io);
