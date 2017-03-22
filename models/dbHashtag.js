'use strict';

module.exports = function(sequelize, DataTypes) {
  var Hashtag = sequelize.define('Hashtag', {
    hashtag: { type: DataTypes.STRING, allowNull: false },
  }, {
    charset: 'utf8mb4',
    classMethods: {
      associate: function(models) {
        Hashtag.belongsToMany(models.Tweet, 
          { 
            as: "Tweets", 
            through: "TweetHashtags",
            foreignKey:  "hashtagId",
            otherKey: "tweetId"
          }
        );
      }
    }
  });
  return Hashtag;
};