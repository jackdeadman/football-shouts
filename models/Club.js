module.exports = function(sequelize, DataTypes) {
  var Club = sequelize.define('club', {
      name: DataTypes.STRING,
      twitterHandle: DataTypes.STRING(15),
  }, {
    classMethods: {
      associate: function (models) {
        Club.hasMany(models.tweet, { as: 'Tweets', foreignKey: 'transferClubId' });
      }
    }
  });
  return Club;
};