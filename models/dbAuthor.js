'use strict';

module.exports = function(sequelize, DataTypes) {
  var Author = sequelize.define('Author', {
    authorHandle: { 
      type: DataTypes.STRING(15), 
      allowNull: false, 
      unique: true 
    },
    authorName: { 
      type: DataTypes.STRING(20), 
      allowNull: false 
    } 
    // https://support.twitter.com/articles/14609
  }, {
    charset: 'utf8mb4'
  });
  return Author;
};