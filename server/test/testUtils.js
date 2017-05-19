var assert = require('assert');

var ModelUtils = require('../models/_utils');

describe('ModelUtils', function() {
  describe('#createTwitterQuery()', function() {
    it('should create a query from a list of players and clubs', function() {
      var result = ModelUtils.createTwitterQuery({
        players: ['Wayne Rooney', '@waynerooney'],
        clubs: ['Man utd']
      });

      var expected = "Wayne Rooney, @waynerooney Man utd";
      assert.equal(expected, result);
    });
  });
});