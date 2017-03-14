var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var config = require('../config.json')

var sequelize = new Sequelize(config.database, config.username, config.password,{
  host: config.host,
  dialect: config.dialect,

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
});

var db = {};

// have to make sure this is done in the right order, otherwise associations don't work

fs.readdirSync(__dirname)
.filter(function(file){
  return (file.indexOf(".") !== 0) && (file !== "Database.js");
})
.forEach(function(file){
  var model = sequelize.import(path.join(__dirname, file));
  db[model.name] = model;
});

Object.keys(db).forEach(function(modelName){
  if ("associate" in db[modelName]) {
      db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
