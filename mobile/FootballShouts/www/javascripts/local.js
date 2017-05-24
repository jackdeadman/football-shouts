var threshold = 7 * 24 * 60 * 60 * 1000 // 7 days

var getTweetsFromLocal = (query) => {

  var sql = "\
  SELECT `Tweet`.`id`, \
         `Tweet`.`text`, \
         `Tweet`.`twitterid`, \
         `Tweet`.`datepublished`, \
         `Tweet`.`hasmedia`, \
         `Tweet`.`retweetcount`, \
         `Tweet`.`favouritecount`, \
         `Tweet`.`createdat`, \
         `Tweet`.`updatedat`, \
         `Tweet`.`transferclubid`, \
         `Tweet`.`playerid`, \
         `Tweet`.`authorid`, \
         `Player`.`id`              AS `Player.id`, \
         `Player`.`name`            AS `Player.name`, \
         `Player`.`twitterhandle`   AS `Player.twitterHandle`, \
         `Player`.`imageurl`        AS `Player.imageUrl`, \
         `Player`.`createdat`       AS `Player.createdAt`, \
         `Player`.`updatedat`       AS `Player.updatedAt`, \
         `Player`.`currentclubid`   AS `Player.currentClubId`, \
         `Club`.`id`                AS `Club.id`, \
         `Club`.`name`              AS `Club.name`, \
         `Club`.`createdat`         AS `Club.createdAt`, \
         `Club`.`updatedat`         AS `Club.updatedAt`, \
         `Author`.`id`              AS `Author.id`, \
         `Author`.`twitterhandle`   AS `Author.twitterHandle`, \
         `Author`.`name`            AS `Author.name`, \
         `Author`.`profileimageurl` AS `Author.profileImageUrl`, \
         `Author`.`createdat`       AS `Author.createdAt`, \
         `Author`.`updatedat`       AS `Author.updatedAt` \
  FROM   `tweets` AS `Tweet` \
         LEFT OUTER JOIN `players` AS `Player` \
                      ON `Tweet`.`playerid` = `Player`.`id` \
                         AND ( `Player`.`twitterhandle` LIKE '?' \
                                OR `Player`.`name` LIKE '?' ) \
         LEFT OUTER JOIN `clubs` AS `Club` \
                      ON `Tweet`.`transferclubid` = `Club`.`id` \
                         AND `Club`.`name` LIKE '?' \
         INNER JOIN `authors` AS `Author` \
                 ON `Tweet`.`authorid` = `Author`.`id` \
  WHERE  ( `Tweet`.`datepublished` >= '?' \
           AND `Tweet`.`datepublished` <= '?' ); ";

  // TODO: make operator do something
  // TODO: make authors do something

  app.localDB.transaction(function(tr) {
    tr.executeSql(sql, [query.player, query.player, query.club, query.lastWeek, query.until], function(tr, rs) {
      console.log('Results: ' + rs.rows);
    });
  });

  console.log("Done");

  tweets = null;
  return tweets;
};

var findTransfers = (player, club, authors, sources, operator) => {
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
    operator,
    club,
    authors,
    since: lastWeek, until: today
  };

  console.log(sources.indexOf('local'));

  if (sources.indexOf('local') > -1) {
    console.log("Here");
    var localTweets = getTweetsFromLocal(query);

    // Ensure the Tweets are in order in order to get the latest
    if (localTweets) {
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
