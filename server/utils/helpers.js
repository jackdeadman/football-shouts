"use strict";

module.exports = {
  /**
   * Partially applies an argument to a function
   * @param fn: function to apply the argument
   * @param arg: argument to partially apply
   */
  apply: function(fn, arg) {
    return function() {
      fn.apply(this, [arg].concat(arguments[0]));
    };
  }
};
