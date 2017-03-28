function scrollTo(position, speed) {
  $('html, body').animate({
      scrollTop: position
  }, speed);
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

function loadGraph(canvas, data, callback) {

  var lineChart = new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [{
          label: 'No. of Tweets',
          data: data,
          backgroundColor: [
              'rgba(153, 102, 255, 0.2)'
          ],
          borderColor: [
              'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
      }]
    },
    options: {
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
    var req = { players: playerTags, clubs: clubTags };
    search.emit('query', req);

    $canvas.hide();
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
  });


})(io);
