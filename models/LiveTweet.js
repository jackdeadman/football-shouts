'use strict';

var util = require('util');
var EventEmitter = require('events');
var utils = require('./_utils');

function LiveTweet(client, streamName, query) {
  EventEmitter.call(this);
  this.client = client;
  this.streamName = streamName;
  this.query = query;
  this.stream = null;
}

util.inherits(LiveTweet, EventEmitter);

LiveTweet.prototype.connect = function() {
  this.stream = this.client.stream(this.streamName, this.query);
  var that = this;
  this.stream.on('tweet', tweet => {
    if(utils.selectTransferTweet(tweet)){
      console.log('new tweet from stream');
      that.emit('tweet', tweet);
    }
  });
};

LiveTweet.prototype.disconnect = function() {
  if (this.stream) {
    this.stream.stop();
  }
};

module.exports = LiveTweet;
