'use strict';

module.exports = function(sequelize, DataTypes) {
  var Club = sequelize.define('Club', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  }, {
    classMethods: {
      associate: function (models) {
        Club.hasMany(models.Tweet, { 
          foreignKey: 'transferClubId' 
        });
      }
    }
  });
  return Club;
};
