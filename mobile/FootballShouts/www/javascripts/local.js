var threshold = 7 * 24 * 60 * 60 * 1000 // 7 days

var getTweetsFromLocal = (query) => {
  // TODO: Get tweets from database using SQL query

//   SELECT `Tweet`.`id`,
//        `Tweet`.`text`,
//        `Tweet`.`twitterId`,
//        `Tweet`.`datePublished`,
//        `Tweet`.`hasMedia`,
//        `Tweet`.`retweetCount`,
//        `Tweet`.`favouriteCount`,
//        `Tweet`.`createdAt`,
//        `Tweet`.`updatedAt`,
//        `Tweet`.`transferClubId`,
//        `Tweet`.`PlayerId`,
//        `Tweet`.`AuthorId`,
//        `Player`.`id` AS `Player.id`,
//        `Player`.`name` AS `Player.name`,
//        `Player`.`twitterHandle` AS `Player.twitterHandle`,
//        `Player`.`imageUrl` AS `Player.imageUrl`,
//        `Player`.`createdAt` AS `Player.createdAt`,
//        `Player`.`updatedAt` AS `Player.updatedAt`,
//        `Player`.`currentClubId` AS `Player.currentClubId`,
//        `Club`.`id` AS `Club.id`,
//        `Club`.`name` AS `Club.name`,
//        `Club`.`twitterHandle` AS `Club.twitterHandle`,
//        `Club`.`createdAt` AS `Club.createdAt`,
//        `Club`.`updatedAt` AS `Club.updatedAt`,
//        `Author`.`id` AS `Author.id`,
//        `Author`.`twitterHandle` AS `Author.twitterHandle`,
//        `Author`.`name` AS `Author.name`,
//        `Author`.`profileImageUrl` AS `Author.profileImageUrl`,
//        `Author`.`createdAt` AS `Author.createdAt`,
//        `Author`.`updatedAt` AS `Author.updatedAt`
// FROM `Tweets` AS `Tweet`
// INNER JOIN `Players` AS `Player` ON `Tweet`.`PlayerId` = `Player`.`id`
// AND (`Player`.`twitterHandle` LIKE '%Wayne Rooney%'
//      OR `Player`.`name` LIKE '%Wayne Rooney%')
// INNER JOIN `Clubs` AS `Club` ON `Tweet`.`transferClubId` = `Club`.`id`
// AND (`Club`.`twitterHandle` LIKE '%Man U%'
//      OR `Club`.`name` LIKE '%Man U%')
// INNER JOIN `Authors` AS `Author` ON `Tweet`.`AuthorId` = `Author`.`id`
// AND (`Author`.`twitterHandle` LIKE '%%'
//      OR `Author`.`name` LIKE '%%')
// WHERE (`Tweet`.`datePublished` >= '2017-05-05 16:26:02'
//        AND `Tweet`.`datePublished` <= '2017-05-19 16:26:02');

  tweets = null;
  return tweets;
};

var findTransfers = (player, club, authors, sources) => {
  /**
   * Finds tweets between players and clubs using database and twitter
   * @param {String} player: Player name
   * @param {String} club: club name
   * @param {[String]} authors: author names
   * @param {Function} callback: fn(err, tweets)
   */
  var lastWeek = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  var today = new Date(Date.now());

  // Build query object
  var query = {
    player,
    club,
    authors,
    since: lastWeek, until: today
  };


  if (sources.indexOf('local') > -1) {
    var localTweets = getTweetsFromLocal(query);

    // Ensure the Tweets are in order in order to get the latest
    localTweets = localTweets.sort((t1, t2) => {
      return new Date(t1.updatedAt) >= new Date(t2.updatedAt) ? -1 : 1;
    });

    localTweets = localTweets.map(tweet => {
      tweet.source = 'local';
      return tweet;
    });

    var latest = localTweets[0];
    // Update if no tweets found or too old
    if (latest && ((today - new Date(latest.updatedAt)) > threshold)) {
      query.since = new Date(latest.datePublished);
    }

    return localTweets;
  }

  console.log('Not searching local database.');
  return null;
};

var findAllTweets = (req) => {

  // Holding variables
  var requests = req.players.length * req.clubs.length;
  var responses = 0;
  var errors = [];
  var allTweets = [];

  // Search using all combinations
  req.players.forEach(player => {
    req.clubs.forEach(club => {
      var tweets = findTransfers(player, club, req.authors, req.sources);
      // response has been received
      responses ++;

      // Accumulate the errors, then tell the client when all requests
      // have been made
      if (!tweets) {
        var msg = 'Failed to get the tweets for this query.';
        errors.push(new Error({message: msg, request: req}));
      } else {
        allTweets = allTweets.concat(tweets);
      }

      // All responses finished
      if (requests === responses) {
        // Order by datePublished
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

        if (errors.length) {
          // TODO: Handle errors here! (i.e. print out the list of errors)
        }
      }
    });
  });

  return allTweets;

};

var groupByDay = (tweets) => {
  /**
   * Group a list of tweets by the day they were published
   * @type {Object[]} tweets: list of tweet objects
   * @type {String} tweets.datePublished: date string of when a tweet was made
   */
  var chartData = {};
  // Create an object where the key is the date and the value is the count
  tweets.forEach(tweet => {
    var newDate = moment(tweet.datePublished).startOf('day').format();
    if (chartData[newDate]) {
      chartData[newDate]++;
    } else {
      chartData[newDate] = 1;
    }
  });

  // Convert this object into an array of {date, count} objects ordered
  // by datePublished
  var finalChartData = [];
  for (var date in chartData) {
    finalChartData.push({ date: date, count: chartData[date] });
  }
  finalChartData = finalChartData.sort((d1, d2) => {
    return new Date(d1.date) > new Date(d2.date) ? 1 : -1;
  });

  return finalChartData;
};

var handleLocalQuery = (req) => {

  // Validate user has given correct fields
  var hasRequiredFields = req && req.players && req.clubs && req.sources
                            && req.authors;
  var errorMsg = null;

  if (!hasRequiredFields) {
    console.log('Please provide players, clubs and author names and the sources.');
    return null;
  }

  // Validate that they are arrays
  if (!Array.isArray(req.players) || !Array.isArray(req.clubs)
      || !Array.isArray(req.sources) || !Array.isArray(req.authors)) {
    console.log('Players and a club names must be arrays.');
    return null;
  }

  return findAllTweets(req);

};
