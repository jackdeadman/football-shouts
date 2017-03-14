module.exports = function(sequelize, DataTypes) {
  var Tweet = sequelize.define('tweet', {
      text: DataTypes.STRING(140),
      tweet_id: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      has_media: DataTypes.BOOLEAN
  });
  return Tweet;
};