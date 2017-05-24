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
  console.log(player);
  return new Promise(function(resolve, reject){
    var searchQuery = "SELECT * FROM Players WHERE name = ?";
    app.localDB.executeSql(searchQuery, [player], function(result) {
      if (result.length === 0) {
        var query = "INSERT INTO Players (name) VALUES  (?)";
        console.log(query);
        app.localDB.executeSql(query, [player], function(result) {
          resolve(result.insertId);
        }, function(error){
          console.error(error);
          reject(error);
        });
      } else {
        resolve(result.insertId);
      }
    }, function(error) {
      console.error(error);
    });
  });
 

  
}

function saveClub(club) {
  return new Promise(function(resolve, reject){
    var searchQuery = "SELECT * FROM Clubs WHERE name = ?";
    app.localDB.executeSql(searchQuery, [club], function(result) {
      if (result.length === 0) {
        var query = "INSERT INTO Clubs (name) VALUES (?)";
        console.log(query);
        app.localDB.executeSql(query, [club], function(result) {
          resolve(result.insertId);
        }, function(error){
          console.error(error);
          reject(error);
        });
      } else {
        resolve(result.insertId);
      }
    }, function(error){
      console.error(error);
    });
  });
  

  
}

function saveAuthor(author) {
  var query = "\
  INSERT INTO `authors` \
            ( \
                        `twitterHandle`, \
                        `name`, \
                        `profileImageUrl` \
            ) \
            VALUES \
            ( \
                        ?, \
                        ?, \
                        ?\
            );";

  // console.log(author);
  return new Promise(function(resolve, reject) {
    app.localDB.executeSql(query, [author.twitterHandle, author.name, author.profileImageUrl], function(rs) {
      resolve(rs.insertId);
    }, function(error) {
      console.error(error);
      reject(error);
    });
  });
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
                        ?,\
                        ?,\
                        ?,\
                        ?,\
                        ?,\
                        ?\
            );";
  return new Promise(function(resolve, reject){
    app.localDB.executeSql(query, [tweet.text, tweet.twitterId, tweet.datePublished, tweet.hasMedia, tweet.retweetCount, tweet.favouriteCount], function(rs) {
      resolve(rs.insertId);
    }, function(error) {
      console.error('Error: ' + error.message);
      reject(error);
    });
  });
  

  // app.localDB.transaction(function(tx) {
  //   tx.executeSql("select count(id) as cnt from tweets;", [], function(tx, res) {
  //     console.log("res.rows.length: " + res.rows.length);
  //     console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt);
  //   });
  // });
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

  Promise.all(everything).then((results) => {
    console.log(results);
  });
}
