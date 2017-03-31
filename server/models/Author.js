'use strict';

module.exports.makeAuthorObject = tweetObject => {
  var authorObject = {
    twitterHandle: tweetObject.twitterHandle,
    name: tweetObject.name,
    profileImageUrl: tweetObject.profileImageUrl
  };
  return authorObject;
};