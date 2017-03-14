module.exports = function(sequelize, DataTypes) {
  var Player = sequelize.define('player', {
      name: DataTypes.STRING,
      twitter_handle: DataTypes.STRING(15),
      image_url: DataTypes.STRING
  });
  return Player;
};