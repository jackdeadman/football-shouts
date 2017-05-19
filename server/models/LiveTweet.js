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
  /**
   * Open connection to a LiveTweet stream
   */
  console.log('!@£$%^&*(): ndjnx');
  console.log(this.streamName, this.query);
  this.stream = this.client.stream(this.streamName, this.query);
  this.stream.on('tweet', tweet => {
    console.log('tweet', tweet)
    if(utils.selectTransferTweet(tweet)){
      this.emit('tweet', tweet);
    }
  });
};

LiveTweet.prototype.disconnect = function() {
  /**
   * Close connection to LiveTweet stream
   */
  if (this.stream) {
    this.stream.stop();
  }
};

module.exports = LiveTweet;
