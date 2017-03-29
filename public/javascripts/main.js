String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

function scrollTo(position, speed) {
  $('html, body').animate({
      scrollTop: position
  }, speed);
}

function parseTweet(text) {
  var hashtagIndex = 0;
  var final = '';
  var leftover = text;
  do {
    //Parsing hashtags
    hashtagIndex = leftover.indexOf('#');
    if (hashtagIndex != -1) {
      var before = '<span class = "blue-text">';
      var after = leftover.slice(hashtagIndex);
      var hashtag = after.slice(hashtagIndex, after.indexOf(' '));
      var link = '<a href = https://twitter.com/search?q=' + encodeURIComponent(hashtag) + ' target = "_blank">';
      leftover = after.slice(after.indexOf(' '));
      final = final + before + link + hashtag + '</a></span>';
    }
  } while(hashtagIndex != -1);

  final = final + leftover;
  return final;
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
  console.log(results)
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
                           '</div><div class="tweetHandle">@' + tweet.authorHandle + '</div></div>');

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
    $tweetsFromTwitter.find('.count').html(results.countFromTwitter);
    $tweetsFromDatabse.find('.count').html(results.countFromDatabase);
  });


})(io);
