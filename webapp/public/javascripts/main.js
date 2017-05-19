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
      responsive: true,
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

  var localResults = [];
  var localChartData = {};

  function handleSearch(req) {
    // Setup livetweets
    liveTweets.emit('subscribe', {
      player: req.players[0],
      author: req.authors[0],
      club: req.clubs[0]
    });

    //Gather all tweets from local database
    allTweets = handleLocalQuery(req);

    //Get the results
    localResults = allTweets.reduce((acc, tweet) => {
      return {
        // Combine tweets by concatenation
        tweets: acc.tweets.concat([tweet]),
        // Add the totals
        countFromLocal: acc.countFromLocal + (tweet.source === 'local');
      };
    }, { tweets: [], countFromLocal: 0 });

    //Get the chart data
    localChartData = groupByDay(allTweets);

    // Send the queries to the server
    search.emit('query', req);
  }

  // Cache templates
  var tweetTemplate = Handlebars.compile($("#tweet-template").html());
  var tweetStatTemplate = Handlebars.compile($("#tweet-stats-template").html());

  // HANDLERS
  function handleSearchError(err) {

    // TODO: show local results still

    alert('Error');
    console.log(err);
  }

  function handleChartResult(data) {
    var stats = renderTweetStats(data, true);
    $tweetStats.html(stats);

    var data = data.data;
    var data = data.map(function(sample) {
      return { x: sample.date, y: sample.count };
    });

    var $canvas = $('canvas');
    loadGraph($canvas, data, function() {
      // $chartLoader.hide();
      $canvas.show();
    });
  }

  var countFromTwitter = 0;
  var countFromDatabase = 0;

  function handleSearchResult(results) {

    // TODO: Merge local results with server results before displaying

    displaySearchResults(results.tweets);
    countFromTwitter = results.countFromTwitter;
    countFromDatabase = results.countFromDatabase;
    var stats = renderTweetStats({
      countFromDatabase: countFromDatabase,
      countFromTwitter: countFromTwitter
    }, false);

    $tweetStats.html(stats);

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
    return tweetStatTemplate({
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
    showApp();
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
  search.on('chart', function(data) {
    handleChartResult({
      data: data,
      countFromDatabase: countFromDatabase,
      countFromTwitter: countFromTwitter
    });
  });
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
    var authors = $('#authors').materialtags('items');
    var sources = $('#options').val();

    handleSearch({
      players: playerTags,
      clubs: clubTags,
      authors: authors,
      sources: sources
    });
    // showApp();
  });

  $loadMoreTweets.on('click', loadLiveTweets);

  // On load hide things
  function hideApp() {

    $loader.hide();
    $loadMoreTweets.hide();
    $appContainer.hide();
  }

  function showApp() {
    $appContainer.show();
  }

  hideApp();
})(io);
