var assert = require('assert');

var ModelUtils = require('../models/_utils');

describe('ModelUtils', function() {
  describe('#createTwitterQuery()', function() {
    it('should create a query from a list of players and clubs', function() {
      var result = ModelUtils.createTwitterQuery({
        players: ['Wayne Rooney', '@waynerooney'],
        clubs: ['Man utd']
      });

      var expected = "Wayne Rooney Man utd, @waynerooney Man utd";
      assert.equal(result, expected);
    });

    it('should create a query from a list of players and authors', function() {
      var result = ModelUtils.createTwitterQuery({
        players: ['Wayne Rooney', '@waynerooney'],
        authors: ['Jack', 'Simon']
      });

      var expected = "Wayne Rooney Jack, Wayne Rooney Simon, @waynerooney Jack, @waynerooney Simon";
      assert.equal(result, expected);
    });

    it('should create a query from a list of players, clubs and authors using AND', function() {
      var result = ModelUtils.createTwitterQuery({
        players: ['Wayne Rooney', '@waynerooney'],
        clubs: ['Man utd', 'Arsenal'],
        authors: ['Jack', 'Simon', 'George'],
        operator: 'AND'
      });

      var expected = "Wayne Rooney Man utd for:Jack, Wayne Rooney Man utd Simon, Wayne Rooney Man utd George, Wayne Rooney Arsenal Jack, Wayne Rooney Arsenal Simon, Wayne Rooney Arsenal George, @waynerooney Man utd Jack, @waynerooney Man utd Simon, @waynerooney Man utd George, @waynerooney Arsenal Jack, @waynerooney Arsenal Simon, @waynerooney Arsenal George";
      assert.equal(result, expected);
    });

    it('should create a query from a list of players, clubs and authors using OR', function() {
      var result = ModelUtils.createTwitterQuery({
        players: ['Wayne Rooney', '@waynerooney'],
        clubs: ['Man utd', 'Arsenal'],
        authors: ['Jack', 'Simon', 'George'],
        operator: 'OR'
      });

      var expected = "Wayne Rooney, @waynerooney, Man utd, Arsenal, Jack, Simon, George";
      assert.equal(expected, result);
    });
  });
});