'use strict';

module.exports = function(sequelize, DataTypes) {
  var Tweet = sequelize.define('Tweet', {
    text: { type: DataTypes.STRING(140), allowNull: false },
    tweetId: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    hasMedia: { type: DataTypes.BOOLEAN, allowNull: false },
    retweetCount: { type: DataTypes.INTEGER, allowNull: false },
    favouriteCount: { type: DataTypes.INTEGER, allowNull: false }
  },{
    charset: 'utf8mb4',
    classMethods: {
      associate: function(models){
        Tweet.belongsTo(models.Author);
        Tweet.belongsToMany(models.Hashtag, 
          { 
            as: "Hashtags", 
            through: "TweetHashtags" 
          }
        );
      }
    }
  });
  return Tweet;
};
