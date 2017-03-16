module.exports = function(sequelize, DataTypes) {
  var Tweet = sequelize.define('Tweet', {
      text: { type: DataTypes.STRING(140), allowNull: false },
      tweetId: { type: DataTypes.INTEGER, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      hasMedia: { type: DataTypes.BOOLEAN, allowNull: false }
  });
  return Tweet;
};