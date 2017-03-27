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
    console.log(result.text);

    var div =     $('<div>', {'class': 'card-panel grey lighten-5 z-depth-1'})
    var innerdiv = $('<div>', {'class': 'row valign-wrapper tweet'});
    var image =   $('<div>', {'class': 'col s2'})
                  .prepend('<img src="/images/test.jpg" alt="" class="circle responsive-img avatar"/>')
    var content = $('<div>', {'class': 'col s10'})
                  .prepend('<span class = "black-text">' + result.text + '</span>');

    var inner = innerdiv.append(image).append(content);
    var combined = div.append(inner);

    node.append(combined);
  });
}


(function(io) {
  // Connections
  var suggestions = io('/suggestions');
  var search = io('/search');
  var liveTweets = io('/liveTweets');

  // Setup Socket listeners
  search.on('error', handleSearchError);

  //Upon pressing the search button, send the entered data
  $('#search').submit(function(e){
    e.preventDefault();

    //Scroll down the page
    $('html, body').animate({
        scrollTop: $("#app").offset().top
    }, 500);

    //Setting up elements
    $('#app').empty();
    $('#playerinfo').css('display', 'block');
    $('#clubinfo').css('display', 'block');

    //Getting tags for search
    var playerTags = $('#players').materialtags('items');
    var clubTags = $('#clubs').materialtags('items');
    var req = { players: playerTags, clubs: clubTags };
    search.emit('query', req);
  });

  // liveTweets.on('tweet', function(tweet) {
  //   console.log(tweet);
  // });

  // liveTweets.emit('subscribe', {
  //   path: 'statuses/filter',
  //   filter: { track: 'mango' }
  // });


  var app = $('#app');
  search.on('result', function(results) {
    console.log(results);
    displaySearchResults(app, results.tweets);
  });


})(io);
