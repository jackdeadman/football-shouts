'use strict';

module.exports = function(sequelize, DataTypes) {
  var Author = sequelize.define('Author', {
    twitterHandle: { 
      type: DataTypes.STRING(15), 
      allowNull: false, 
      unique: true 
    },
    name: { 
      type: DataTypes.STRING(20), 
      allowNull: false 
    },
    // https://support.twitter.com/articles/14609
    profileImageUrl: {
      type: DataTypes.STRING
    }
  }, {
    charset: 'utf8mb4'
  });
  return Author;
};