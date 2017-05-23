var makeAuthorObject = tweetObject => {
  var authorObject = {
    twitterHandle: tweetObject.twitterHandle,
    name: tweetObject.name,
    profileImageUrl: tweetObject.profileImageUrl
  };
  return authorObject;
};

var makeTweetDbObject = tweetObject => {
  /**
   * Makes a tweet object with just the fields for the Tweets table.
   */
  var tweetDbObject = {
    text: tweetObject.text,
    twitterId: tweetObject.twitterId,
    datePublished: tweetObject.datePublished,
    hasMedia: tweetObject.hasMedia == 'True' ? 1 : 0,
    retweetCount: tweetObject.retweetCount,
    favouriteCount: tweetObject.favouriteCount
  };

  return tweetDbObject;
};

function savePlayer(player) {

}

function saveClub(club) {

}

function saveAuthor(author) {
  var query = "\
  INSERT INTO `authors` \
            ( \
                        `twitterhandle`, \
                        `NAME`, \
                        `profileimageurl` \
            ) \
            VALUES \
            ( \
                        '?', \
                        '?', \
                        '?'\
            );";

  // console.log(author);

  app.localDB.transaction(function(tr) {
    tr.executeSql(query, [author.twitterHandle, author.name, author.profileimageurl], function(tr, rs) {
      console.log('InsertId: ' + rs.insertId);
    });
  });
  return true;
}

function saveTweet(tweet) {
  var query = "\
  INSERT INTO 'tweets' \
            ( \
              'text', \
              'twitterId', \
              'datePublished', \
              'hasMedia', \
              'retweetCount', \
              'favouriteCount' \
            ) \
            VALUES \
            ( \
                        '?',\
                        '?',\
                        '?',\
                        ?,\
                        ?,\
                        ?\
            );";

  console.log(query);
  console.log(tweet);
  app.localDB.executeSql(query, [tweet.text, tweet.twitterId, tweet.datePublished, tweet.hasMedia, tweet.retweetCount, tweet.favouriteCount], function(rs) {
    console.log('InsertId: ' + rs.insertId);
  }, function(error) {
      console.log('Error: ' + error.message);
  });

  // app.localDB.transaction(function(tx) {
  //   tx.executeSql("select count(id) as cnt from tweets;", [], function(tx, res) {
  //     console.log("res.rows.length: " + res.rows.length);
  //     console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt);
  //   });
  // });

  return true;
}

function saveHashtags(hashtags) {

}

function saveLocalDatabase(tweet, player, club, author, hashtags) {
  var everything = [];

  var tweetSaved = saveTweet(tweet);
  everything.push(tweetSaved);
  var authorSaved = saveAuthor(author);
  everything.push(authorSaved);

  if (player !== "") {
    var playerSaved = savePlayer(player);
    everything.push(playerSaved);
  }
  if (club !== "") {
    var clubSaved = saveClub(club);
    everything.push(clubSaved);
  }
  if (hashtags.length !== 0) {
    var hashtagsSaved = saveHashtags(hashtags);
    everything.push(hashtagsSaved);
  }

  return Promise.all(everything);
}
