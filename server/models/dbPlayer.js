'use strict';

module.exports = function(sequelize, DataTypes) {
  var Player = sequelize.define('Player', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    twitterHandle: { type: DataTypes.STRING(15), unique: true }, 
    // players might not have twitter handles
    imageUrl: DataTypes.STRING, 
    // should we allow this to be null?
  }, {
    classMethods: {
      associate: function (models) {
        Player.belongsTo(models.Club, { foreignKey: 'currentClubId' });
        Player.hasMany(models.Tweet);
        Player.belongsToMany(models.Position, {
          as: "Positions",
          through: "PlayerPositions",
          foreignKey: "playerId",
          // otherKey: "positionId"
        });
      }
    }
  });
  return Player;
};
