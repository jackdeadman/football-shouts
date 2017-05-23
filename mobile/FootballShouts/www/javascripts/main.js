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
            yAxes: [
              {
                  ticks: {
                      beginAtZero: true
                  }
              }
            ],

            xAxes: [{
            type: 'time',
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 45,
              stepSize: 0.5
            },
            time: {
              displayFormats: {
                        unit: 'day'
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
  var search = io('http://164.132.47.12:3000/search');
  var liveTweets = io('http://164.132.47.12:3000/liveTweets');

  // Cache the DOM
  var $app = $('#app');
  var $searchContainer = $('#search');
  var $submitButton = $('#submit-button');
  var $loader = $('#loader');
  var $loadMoreTweets = $('#loadMoreTweets');
  var $appContainer = $('#app-container');
  var $tweetStats = $('#tweet-stats');
  var $operatorSelector = $('#operator-switcher');
  var $playerDataLocation = $('#player-data-location');

  var localResults = null;
  var localChartData = {};

  function handleSearch(req) {
    // Setup livetweets
    liveTweets.emit('subscribe', {
      player: req.players[0],
      author: req.authors[0],
      club: req.clubs[0]
    });

    //Gather all tweets from local database
    var localTweets = handleLocalQuery(req);

    //Get the results
    localResults = localTweets.reduce((acc, tweet) => {
      return {
        // Combine tweets by concatenation
        tweets: acc.tweets.concat([tweet]),
        // Add the totals
        countFromLocal: acc.countFromLocal + (tweet.source === 'local')
      };
    }, { tweets: [], countFromLocal: 0 });

    //Get the chart data
    localChartData = groupByDay(localTweets);

    // Send the queries to the server
    var latestLocal = localResults.tweets[0];
    if (!latestLocal || ((today - new Date(latestLocal.updatedAt)) > threshold))
      search.emit('query', req);
    else
      displayLocal();

  }

  // Cache templates
  var tweetTemplate = Handlebars.compile($("#tweet-template").html());
  var tweetStatTemplate = Handlebars.compile($("#tweet-stats-template").html());
  var playerDataTemplate = Handlebars.compile($("#player-data-template").html());

  var countFromTwitter = 0;
  var countFromDatabase = 0;
  var countFromLocal = 0;

  function displayLocal() {
    displaySearchResults(localResults.tweets);

    countFromLocal = localResults.countFromLocal;
    var stats = renderTweetStats({
      countFromLocal: countFromLocal,
      countFromDatabase: 0,
      countFromTwitter: 0
    }, false);

    $tweetStats.html(stats);

    // Finally scroll down the page
    scrollTo($appContainer.offset().top, 750, function() {
      //Swapping the loader with the button again
      $loader.hide();
      $submitButton.show();
    });
  }

  // HANDLERS
  function handleSearchError(err) {
    displayLocal();

    alert("Error");
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

  function storeInLocalDB(tweets, latest) {

    if (latest) {
      //trim list of tweets to only contain latest
    }

    tweets.forEach(function(tweet, i){
      // TODO: store player and club info in local
      // TODO: store hashtags in local
      // var hashtags = originalTweetList[i].entities.hashtags;
      // hashtags = Hashtag.processHashtags(hashtags);
      var author = makeAuthorObject(tweet);
      tweet = makeTweetDbObject(tweet);
      var everythingSaved = saveLocalDatabase(tweet, "", "", author, []);
    });
  }

  function handleSearchResult(results) {

    //Merging local tweets and server tweets
    var allTweets = localResults.tweets.concat(results.tweets);

    allTweets = allTweets.sort((t1, t2) => {
      var datePublished1 = new Date(t1.datePublished);
      var datePublished2 = new Date(t2.datePublished);
      return datePublished1 >= datePublished2 ? -1 : 1;
    });

    // Remove duplicate twitters
    var prev = { twitterId: null };
    allTweets = allTweets.filter(t => {
      var different = prev.twitterId !== t.twitterId;
      prev = t;
      return different;
    });

    if (localResults.tweets[0])
      storeInLocalDB(results.tweets, new Date(localResults.tweets[0].updatedAt));
    else
      storeInLocalDB(results.tweets);

    console.log(results.tweets, localResults.tweets, allTweets);

    clearSearchResults();
    displaySearchResults(allTweets);
    countFromTwitter = results.countFromTwitter;
    countFromDatabase = results.countFromDatabase;
    countFromLocal = localResults.countFromLocal;
    var stats = renderTweetStats({
      countFromLocal: countFromLocal,
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
      countFromLocal: counts.countFromLocal,
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

  function clearSearchResults() {
    $app.empty();
  }

  function toUpperCase(string) {
    return string.replace(/\b\w/g, function(s) {
      return s.toUpperCase()
    });
  }

  function displayPlayers(player) {
    // console.log(players);
    // var player = players[0];
    if (player) {
      console.log(player);
      player.positionClean = player.positions.map(toUpperCase).join(', ')
      player.loading = false;
      $playerDataLocation.html(playerDataTemplate(player));
    }
  }

  hiddenTweets = []
  function handleNewLiveTweet(tweet) {
    hiddenTweets.push(tweet);
    document.title = '(' + hiddenTweets.length + ') ' + title;
    $loadMoreTweets.find('.count').html(hiddenTweets.length);
    $loadMoreTweets.show();
  }

  var title = document.title;
  function loadLiveTweets() {
    // Add new tweets to the page one-by-one
    while (hiddenTweets.length !== 0) {
      $app.prepend(renderTweet(hiddenTweets.pop()));
    }

    document.title = title;
    $(this).hide();
  }

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
  search.on('playerData', displayPlayers);

  // Setup DOM listeners

  //Upon pressing the search button, send the entered data
  $searchContainer.on('submit', function(e) {
    $playerDataLocation.html(playerDataTemplate({loading: true}));
    // Unsub from previous search
    liveTweets.emit('unsubscribe');
    document.title = title;
    hideApp();
    e.preventDefault();
    // Empty livetweets not shown
    hiddenTweets = [];

    // Swapping the button with the loading animation
    $submitButton.fadeOut(200);
    $loader.fadeIn(200);

    // TODO: THESE SHOULD BE CACHED
    var playerTags = $('#players').materialtags('items');
    var clubTags = $('#clubs').materialtags('items');
    var authors = $('#authors').materialtags('items');
    var sources = $('#options').val();

    var operator = $operatorSelector.find('input')[0].checked ? 'AND' : 'OR'
    console.log(operator);

    handleSearch({
      players: playerTags,
      clubs: clubTags,
      authors: authors,
      sources: sources,
      operator: operator
    });

    // Get player data
    search.emit('playerData', playerTags);
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
