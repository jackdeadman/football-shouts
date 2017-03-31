'use strict';

module.exports.isHashtag = string => {
  return string.lastIndexOf('#', 0) === 0;
};

module.exports.stripHashtag = string => {
  return string.substring(1,string.length);
};

module.exports.processHashtags = hashtags => {
  if(hashtags.length){
    hashtags = hashtags.map(hashtag => hashtag.text.toLowerCase());
  }else{
    hashtags = [];
  }
  return hashtags;
};