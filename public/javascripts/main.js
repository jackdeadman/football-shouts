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


(function(socket) {
  // Setup Socket listeners
  socket.on('searchError', handleSearchError);
  socket.on('searchResult', displaySearchResults);

  // Send some data to the server to test
  var req = { player: 'Wayne', club: 'Brighton' };
  socket.emit('search', req);

})(io());
