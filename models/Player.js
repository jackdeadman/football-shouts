module.exports = function(sequelize, DataTypes) {
  var Player = sequelize.define('player', {
      name: DataTypes.STRING,
      twitterHandle: DataTypes.STRING(15),
      imageUrl: DataTypes.STRING
  }, {
    classMethods: {
      associate: function (models) {
        Player.belongsTo(models.club, { foreignKey: 'currentClubId' });
        Player.hasMany(models.tweet, { as: 'Tweets' });
      }
    }
  });
  return Player;
};