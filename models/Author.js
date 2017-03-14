module.exports = function(sequelize, DataTypes) {
  var Author = sequelize.define('Author', {
    authorHandle: DataTypes.STRING(15),
    authorName: DataTypes.STRING(20) // https://support.twitter.com/articles/14609
  }, {
    classMethods: {
      associate: function (models) {
        Author.hasMany(models.Tweet, { as: 'Tweets' });
      }
    }
  });
  return Author;
};