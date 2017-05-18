function scrollTo(position, speed, callback) {
  $('html, body').animate({
      scrollTop: position
  }, speed, 'swing', callback);
}

function parseTweet(text) {
  var parsed = text.replace(/(https?:\/\/(bit\.ly|t\.co|lnkd\.in|tcrn\.ch)\S*)\b/gi, '<a href = "$1" target = "_blank">$1</a>');
  parsed = parsed.replace(/#([A-Za-z0-9_]*)/g,'<a href="http://twitter.com/#!/search/$1" target = "_blank">#$1</a>');
  parsed = parsed.replace(/@([A-Za-z0-9_]*)/g,'<a href="https://twitter.com/$1" target = "_blank">@$1</a>');

  return parsed;
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
          borderWidth: 1,
          fill: 'zero'
      }]
    },
    options: {
      responsive: false,
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
  var $searchContainer = $('#search');
  var $submitButton = $('#submit-button');
  var $loader = $('#loader');
  var $loadMoreTweets = $('#loadMoreTweets');
  var $appContainer = $('#app-container');
  var $tweetStats = $('#tweet-stats');

  function handleSearch(req) {
  // Setup livetweets
  liveTweets.emit('subscribe', {
    player: req.players[0],
    club: req.clubs[0]
  });

  // Send the queries
  search.emit('query', req);
};

  // var $chartHolder = $('#js-tweet-chart-container');
  // var $canvas = $chartHolder.find('canvas');
  // var $chartLoader = $chartHolder.find('#chartLoader')
  // var $tweetStats = $('#js-tweet-stats');
  // var $tweetData = $('#tweetData');
  // var $tweetsFromTwitter = $('#tweetsFromTwitter');
  // var $tweetsFromDatabase = $('#tweetsFromDatabase');
  // var $sideInfo = $('#side-info');

  // Cache templates
  var tweetTemplate = Handlebars.compile($("#tweet-template").html());
  var tweetStateTemplate = Handlebars.compile($("#tweet-stat-template").html());

  // HANDLERS
  function handleSearchError(err) {
    alert('Error');
    console.log(err);
  }

  function handleChartResult(data) {
    data = data.map(function(sample) {
      return { x: sample.date, y: sample.count };
    });
    var $canvas = $('canvas');
    loadGraph($canvas, data, function() {
      // $chartLoader.hide();
      $canvas.show();
    });
  }

  function handleSearchResult(results) {
    displaySearchResults(results.tweets);
    var stats = renderTweetStats({
      countFromDatabase: results.countFromDatabase,
      countFromTwitter: results.countFromTwitter
    }, false);
    console.log(stats);
    $tweetStats.html(stats);

    // Show loading
    // if ($appContainer.is(":hidden"))
    //   $appContainer.show();
    // else {
    //   $appContainer.css('visibility', 'visible');
    //   $appContainer.animate({
    //     opacity: 1
    //   }, 100, 'swing');
    // }

    // Finally scroll down the page
    scrollTo($appContainer.offset().top, 750, function() {
      //Swapping the loader with the button again
      $loader.hide();
      $submitButton.show();
    });
  }

  // Render functions
  function renderTweet(tweet) {
    tweet.text = parseTweet(tweet.text);
    tweet.datePublished = moment(tweet.datePublished).format('LLL')
    return tweetTemplate(tweet);
  }

  function renderTweetStats(counts, renderGraph) {
    return tweetStateTemplate({
      countFromTwitter: counts.countFromTwitter,
      countFromDatabase: counts.countFromDatabase,
      renderGraph: renderGraph
    });
  }

  function displaySearchResults(results) {
    results.forEach(function(tweet) {
      var tweetNode = renderTweet(tweet)
      $app.append(tweetNode);
    });
  }

  hiddenTweets = []
  function handleNewLiveTweet(tweet) {
    var node = renderTweet(tweet);
    hiddenTweets.push(tweet);
    document.title = '(' + hiddenTweets.length + ') ' + title;
    $loadMoreTweets.find('.count').html(hiddenTweets.length);
    $loadMoreTweets.show();
  }

  function loadLiveTweets() {
    // Add new tweets to the page one-by-one
    while (hiddenTweets.length !== 0) {
      $app.prepend(renderTweet(hiddenTweets.pop()));
    }
    document.title = title;
    $(this).hide();
  }

  var title = document.title;

  liveTweets.on('tweet', function(tweet) {
    var node = createTweetNode(tweet);
    hiddenTweets.push(tweet);
    document.title = '(' + hiddenTweets.length + ') ' + title;
    $loadMoreTweets.show();
    $loadMoreTweets.find('.count').html(hiddenTweets.length);
  });

  // Setup Socket listeners
  // SEARCH
  search.on('error', handleSearchError);
  search.on('chart', handleChartResult);
  search.on('result', handleSearchResult);
  liveTweets.on('tweet', handleNewLiveTweet);

  // Setup DOM listeners

  //Upon pressing the search button, send the entered data
  $searchContainer.on('submit', function(e) {
    hideApp();
    e.preventDefault();
    // Empty livetweets not shown
    hiddenTweets = [];

    // Swapping the button with the loading animation
    $submitButton.fadeOut(200);
    $loader.fadeIn(200);

    var playerTags = $('#players').materialtags('items');
    var clubTags = $('#clubs').materialtags('items');
    var sources = $('#options').val();

    handleSearch({
      players: playerTags,
      clubs: clubTags,
      sources: sources
    });
    $app.show();
  });

  $loadMoreTweets.on('click', loadLiveTweets);

  // On load hide things
  function hideApp() {
    $app.hide();
    $loader.hide();
    $loadMoreTweets.hide();
  }

  function showApp() {
    $app.show();
  }

  hideApp();
})(io);
