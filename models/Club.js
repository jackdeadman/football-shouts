module.exports = function(sequelize, DataTypes) {
  var Club = sequelize.define('club', {
      name: DataTypes.STRING,
      twitter_handle: DataTypes.STRING(15),
  }, {
      classMethods: {
          associate: function(models) {
          }
      }
  });
  return Club;
};