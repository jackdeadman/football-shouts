'use strict';

module.exports = function(sequelize, DataTypes) {
  var Position = sequelize.define('Position', {
    name: { type: DataTypes.STRING, allowNull: false }
  }, {
    classMethods: {
      associate: function(models) {
        Position.belongsToMany(models.Player, {
          as: "Players",
          through: "PlayerPositions",
          foreignKey: "positionId",
          otherKey: "playerId"
        });
      }
    }
  });
  return Position;
};