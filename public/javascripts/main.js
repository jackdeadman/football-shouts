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

function loadGraph($holder, data) {
  $holder.show();
  var canvas = $holder.find('canvas');

  var myLineChart = new Chart(canvas, {
    type: 'line',
    data: data
  });

  $holder.find('canvas').show();
}


(function(io) {
  // Connections
  var suggestions = io('/suggestions');
  var search = io('/search');
  var liveTweets = io('/liveTweets');

  var $chartHolder = $('#js-tweet-chart-container');

  $chartHolder.hide();

  // Setup Socket listeners
  search.on('error', handleSearchError);

  //Upon pressing the search button, send the entered data
  $('#search').submit(function(e){
    e.preventDefault();

    //Setting up elements
    $('#app').empty();
    $('#playerinfo').css('display', 'block');
    $('#clubinfo').css('display', 'block');

    //Getting tags for search
    var playerTags = $('#players').materialtags('items');
    var clubTags = $('#clubs').materialtags('items');
    var req = { players: playerTags, clubs: clubTags };
    search.emit('query', req);


    $chartHolder.find('canvas').hide();

    loadGraph($chartHolder, {
        labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
        datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    });
  });

  search.on('graph', function(data) {
    loadGraph($chartHolder, data);
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
