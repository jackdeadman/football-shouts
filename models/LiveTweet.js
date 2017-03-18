'use strict';

var util = require('util');
var EventEmitter = require('events');

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
  this.stream.on('tweet', function(tweet) {
    console.log('new tweet from stream');
    this.emit('tweet', tweet);
  });
};

LiveTweet.prototype.disconnect = function() {
  if (this.stream) {
    this.stream.stop();
  }
};

module.exports = LiveTweet;
