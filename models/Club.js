module.exports = function(sequelize, DataTypes) {
  var Club = sequelize.define('Club', {
      name: DataTypes.STRING,
      twitterHandle: DataTypes.STRING(15),
  }, {
    classMethods: {
      associate: function (models) {
        Club.hasMany(models.Tweet, { as: 'Tweets', foreignKey: 'transferClubId' });
      }
    }
  });
  return Club;
};