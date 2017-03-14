module.exports = function(sequelize, DataTypes) {
  var Tweet = sequelize.define('Tweet', {
      text: DataTypes.STRING(140),
      tweetId: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      hasMedia: DataTypes.BOOLEAN
  });
  return Tweet;
};