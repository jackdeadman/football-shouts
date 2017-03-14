module.exports = function(sequelize, DataTypes) {
  var Author = sequelize.define('author', {
    authorHandle: DataTypes.STRING(15),
    authorName: DataTypes.STRING(20) // https://support.twitter.com/articles/14609
  }, {
    classMethods: {
      associate: function (models) {
        Author.hasMany(models.tweet, { as: 'Tweets' });
      }
    }
  });
  return Author;
};