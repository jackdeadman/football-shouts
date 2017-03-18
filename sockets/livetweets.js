var handlers = {
  subscribe: function(req) {
    var path = req.path;
    var filter = req.filter;
    // Need to add security checks here
    var stream = client.stream(path, filter);

    stream.on('tweet', function(tweet) {
      console.log('I HAZ TWEET');
      // Obviously will add checks here lol
      socket.emit('tweet', tweet);
    });
  }
}

module.exports.handlers = handlers;
