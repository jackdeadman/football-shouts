'use strict';

module.exports = function(sequelize, DataTypes) {
  var Tweet = sequelize.define('Tweet', {
    text: { type: DataTypes.STRING(140), allowNull: false },
    twitterId: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    datePublished: { type: DataTypes.DATE, allowNull: false },
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
            through: "TweetHashtags",
            foreignKey: "tweetId",
            otherKey: "hashtagId"
          }
        );
        Tweet.belongsTo(models.Player);
        Tweet.belongsTo(models.Club, { foreignKey: "transferClubId" });
      }
    }
  });
  return Tweet;
};
