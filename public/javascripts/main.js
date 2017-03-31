function scrollTo(position, speed, callback) {
  $('html, body').animate({
      scrollTop: position
  }, speed, 'swing', callback);
}

function parseTweet(text) {
  var parsed = text.replace(/(https?:\/\/(bit\.ly|t\.co|lnkd\.in|tcrn\.ch)\S*)\b/gi, '<a href = "$1" target = "_blank">$1</a>');
  parsed = parsed.replace(/#([A-Za-z0-9]*)/g,'<a href="http://twitter.com/#!/search/$1" target = "_blank">#$1</a>');
  parsed = parsed.replace(/@([A-Za-z0-9]*)/g,'<a href="https://twitter.com/$1" target = "_blank">@$1</a>');

  return parsed;
}

function handleSearchError(err) {
  // TODO: Add error handling
  alert('Error');
  console.log(err);
}

function createTweetNode(tweet) {
  var tweetText = parseTweet(tweet.text);

  var div =     $('<div>', {'class': 'card-panel z-depth-1'});
  var innerdiv = $('<div>', {'class': 'row valign-wrapper tweet'});
  var image =   $('<div>', {'class': 'col s2'})
                .prepend('<img src="' + tweet.profileImageUrl + '" alt="" class="circle responsive-img avatar"/>');
  var content = $('<div>', {'class': 'col s10'})
                .prepend('<div class = "tweetDate">' + moment(tweet.datePublished).format('LLL') + '</div>')
                .prepend('<span class = "black-text">' + tweetText + '</span>')
                .prepend('<div class="tweetTop"><div class="tweetName">' +
                         '<a href = "https://twitter.com/' + tweet.twitterHandle + '" target = "_blank" class = "black-text">' + tweet.name + '</a>' +
                         '</div><div class="tweetHandle"> ' +
                         '<a href = "https://twitter.com/' + tweet.twitterHandle + '" target = "_blank">@' + tweet.twitterHandle + '</a></div></div>');

  var inner = innerdiv.append(image).append(content);
  var combined = div.append(inner);
  return combined;
}

function loadGraph(canvas, data, callback) {

  var lineChart = new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [{
          label: 'No. of Tweets',
          data: data,
          backgroundColor:'rgba(153, 102, 255, 0.2)'
          ,
          borderColor:
              'rgba(153, 102, 255, 1)'
          ,
          borderWidth: 1
      }]
    },
    options: {
      tooltips: {
        callbacks: {
                      title: function(item) {
                          return moment(item[0].xLabel).format('LL');
                      },
                  }
          },
        scales: {
            xAxes: [{
            type: 'time',
            time: {
              displayFormats: {
                 'millisecond': 'MMM DD',
                 'second': 'MMM DD',
                 'minute': 'MMM DD',
                 'hour': 'MMM DD',
                 'day': 'MMM DD',
                 'week': 'MMM DD',
                 'month': 'MMM DD',
                 'quarter': 'MMM DD',
                 'year': 'MMM DD'
              },
              ticks: {
                    stepSize: 2,
                    autoSkip: false
                }
            }
          }]
        }
      }
  });

  callback(lineChart);
}


(function(io) {
  // Connections with sockets
  var search = io('/search');
  var liveTweets = io('/liveTweets');

  // Cache the DOM
  var $app = $('#app');

  var $chartHolder = $('#js-tweet-chart-container');
  var $canvas = $chartHolder.find('canvas');
  var $chartLoader = $chartHolder.find('#loader')
  var $loadMoreTweets = $('#loadMoreTweets');
  var $tweetStats = $('#js-tweet-stats');
  var $tweetData = $('#tweetData');
  var $tweetsFromTwitter = $('#tweetsFromTwitter');
  var $tweetsFromDatabase = $('#tweetsFromDatabase');
  var $searchContainer = $('#search');
  var $appContainer = $('#app-container');
  var $submitButton = $('#submit-button');
  var $loader = $('#loader');

  // Hide components
  $loadMoreTweets.hide();
  $chartHolder.hide();
  $tweetStats.hide();
  $('#app-container').hide();
  var hiddenTweets = [];
  $tweetData.hide();
  $appContainer.hide();
  $loader.hide();

  function displaySearchResults(results) {
    results.forEach(function(tweet) {
      var tweetNode = createTweetNode(tweet)
      $app.append(tweetNode);
    });
  }

  // Setup Socket listeners
  search.on('error', handleSearchError);


  // Setup DOM listeners

  //Upon pressing the search button, send the entered data
  $searchContainer.on('submit', function(e){
    e.preventDefault();
    hiddenTweets = [];

    // Swapping the button with the loading animation
    $submitButton.fadeOut(200);
    $loader.fadeIn(200);

    // Hide in case of searching again
    $canvas.hide();
    $tweetStats.hide();
    $('#tweetData').hide();
    $loadMoreTweets.hide();

    // Setting up elements
    $app.empty();
    $('#playerinfo').css('display', 'block');
    $('#clubinfo').css('display', 'block');

    //Getting form data
    var playerTags = $('#players').materialtags('items');
    var clubTags = $('#clubs').materialtags('items');
    var sources = $('#options').val();
    var req = {
      players: playerTags,
      clubs: clubTags,
      sources: sources
    };

    // Setup livetweets
    liveTweets.emit('subscribe', {
      player: playerTags[0],
      club: clubTags[0]
    });

    // Send the queries
    search.emit('query', req);

    // Show loading
	  $('#app-container').show();
    $chartHolder.show();
    $chartLoader.show();

  });

  search.on('chart', function(data) {
    console.log('data', data);
    data = data.map(function(sample) {
      return { x: sample.date, y: sample.count };
    });
    loadGraph($canvas, data, function() {
      $chartLoader.hide();
      $canvas.show();
    });
  });

  search.on('result', function(results) {
    displaySearchResults(results.tweets);
    $tweetsFromTwitter.html(results.countFromTwitter);
    $tweetsFromDatabase.html(results.countFromDatabase);
    $tweetStats.show();
    $tweetData.show();


    // Finally scroll down the page
    scrollTo($appContainer.offset().top, 750, function() {
      //Swapping the loader with the button again
      $loader.hide();
      $submitButton.show();
    });
  });

  // Send some data to the server to test
  // var req = { players: ['Wayne Rooney', '@waynerooney'], clubs: ['Brighton', '@brighton'] };
  // search.emit('query', req);

  // liveTweets.emit('subscribe', {
  //   path: 'statuses/filter',
  //   filter: { track: 'mango' }
  // });

  var title = document.title;

  liveTweets.on('tweet', function(tweet) {
    console.log('new tweet');
    var node = createTweetNode(tweet);
    hiddenTweets.push(tweet);
    document.title = '(' + hiddenTweets.length + ') ' + title;
    $loadMoreTweets.show();
    $loadMoreTweets.find('.count').html(hiddenTweets.length);
  });

  $loadMoreTweets.on('click', function() {
    while (hiddenTweets.length !== 0) {
      $app.prepend(createTweetNode(hiddenTweets.pop()));
    }
    document.title = title;
    $(this).hide();
  });




})(io);
