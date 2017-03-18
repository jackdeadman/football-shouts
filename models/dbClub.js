'use strict';

module.exports = function(sequelize, DataTypes) {
  var Club = sequelize.define('Club', {
    name: { type: DataTypes.STRING, allowNull: false },
    twitterHandle: { type: DataTypes.STRING(15) }, // club might not have a twitter account
  }, {
    classMethods: {
      associate: function (models) {
        Club.hasMany(models.Tweet, { as: 'Tweets', foreignKey: 'transferClubId' });
      }
    }
  });
  return Club;
};
