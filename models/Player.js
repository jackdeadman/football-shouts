module.exports = function(sequelize, DataTypes) {
  var Player = sequelize.define('Player', {
      name: DataTypes.STRING,
      twitterHandle: DataTypes.STRING(15),
      imageUrl: DataTypes.STRING
  }, {
    classMethods: {
      associate: function (models) {
        Player.belongsTo(models.Club, { foreignKey: 'currentClubId' });
        Player.hasMany(models.Tweet, { as: 'Tweets' });
      }
    }
  });
  return Player;
};