'use strict';

module.exports = function(sequelize, DataTypes) {
  var Player = sequelize.define('Player', {
    name: { type: DataTypes.STRING, allowNull: false },
    twitterHandle: { type: DataTypes.STRING(15) }, // players might not have twitter handles
    imageUrl: DataTypes.STRING // should we allow this to be null?
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
