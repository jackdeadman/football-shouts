function scrollTo(position, speed) {
  $('html, body').animate({
      scrollTop: position
  }, speed);
}

function parseTweet(text) {
  var parsed = text.replace(/(https?:\/\/(bit\.ly|t\.co|lnkd\.in|tcrn\.ch)\S*)\b/gi, '<a href = "$1" target = "_blank">$1</a>');
  parsed = parsed.replace(/#(\S*)/g,'<a href="http://twitter.com/#!/search/$1" target = "_blank">#$1</a>');
  parsed = parsed.replace(/@(\S*)/g,'<a href="https://twitter.com/$1" target = "_blank">@$1</a>');

  return parsed;
}

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

  // console.log(parseTweet('Report claims West Ham ready to pay £150,000-a-week to 31-year-old #WHU #COYI #Rooney #MUFC https://t.co/ilxANjgIAT'));

  console.log(results);
  results.forEach(function(tweet) {

    var tweetText = parseTweet(tweet.text);

    var div =     $('<div>', {'class': 'card-panel z-depth-1'});
    var innerdiv = $('<div>', {'class': 'row valign-wrapper tweet'});
    var image =   $('<div>', {'class': 'col s2'})
                  .prepend('<img src="/images/egg.png" alt="" class="circle responsive-img avatar"/>');
    var content = $('<div>', {'class': 'col s10'})
                  .prepend('<div class = "tweetDate">' + moment(tweet.createdAt).format('LLL') + '</div>')
                  .prepend('<span class = "black-text">' + tweetText + '</span>')
                  .prepend('<div class="tweetTop"><div class="tweetName">' + tweet.authorName +
                           '</div><div class="tweetHandle"> ' +
                           '<a href = "https://twitter.com/' + tweet.authorHandle + '" target = "_blank">@' + tweet.authorHandle + ' +' + tweet.source + '</a></div></div>');

    var inner = innerdiv.append(image).append(content);
    var combined = div.append(inner);
    // console.log(tweet.createdAt, tweet.source)
    // console.log(tweet);

    node.append(combined);
  });
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
  // Connections
  var suggestions = io('/suggestions');
  var search = io('/search');
  var liveTweets = io('/liveTweets');

  var $chartHolder = $('#js-tweet-chart-container');
  var $canvas = $chartHolder.find('canvas');
  var $chartLoader = $chartHolder.find('#loader')
  $chartHolder.hide();

  var $tweetStats = $('#js-tweet-stats');
  $tweetStats.hide();
  var $tweetsFromTwitter = $($tweetStats).find('.js-twitter-stats')
  var $tweetsFromDatabse = $($tweetStats).find('.js-database-stats')

  // Setup Socket listeners
  search.on('error', handleSearchError);

  //Upon pressing the search button, send the entered data
  $('#search').submit(function(e){
    e.preventDefault();

    //Scroll down the page
    scrollTo($("#js-tweet-start").offset().top, 1000);

    //Setting up elements
    $('#app').empty();
    $('#playerinfo').css('display', 'block');
    $('#clubinfo').css('display', 'block');

    //Getting tags for search
    var playerTags = $('#players').materialtags('items');
    var clubTags = $('#clubs').materialtags('items');
    var sources = $('#options').val();
    var req = {
      players: playerTags,
      clubs: clubTags,
      sources: sources
    };
    search.emit('query', req);

    $canvas.hide();
    $tweetStats.hide();

    $chartHolder.show();
    $chartLoader.show();
  });

  search.on('chart', function(data) {
    data = data.map(function(sample) {
      return { x: sample.date, y: sample.count };
    });
    loadGraph($canvas, data, function() {
      $chartLoader.hide();
      $canvas.show();
    });
  });

  // Send some data to the server to test
  // var req = { players: ['Wayne Rooney', '@waynerooney'], clubs: ['Brighton', '@brighton'] };
  // search.emit('query', req);


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
    $tweetStats.show();
    $('#tweetsFromTwitter').html(results.countFromTwitter);
    $('#tweetsFromDatabase').html(results.countFromDatabase);
  });

})(io);
