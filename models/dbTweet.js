module.exports = function(sequelize, DataTypes) {
  var Tweet = sequelize.define('Tweet', {
      text: { type: DataTypes.STRING(140), allowNull: false },
      tweetId: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      hasMedia: { type: DataTypes.BOOLEAN, allowNull: false },
      retweetCount: { type: DataTypes.INTEGER, allowNull: false },
      favouriteCount: { type: DataTypes.INTEGER, allowNull: false }
  });
  return Tweet;
};