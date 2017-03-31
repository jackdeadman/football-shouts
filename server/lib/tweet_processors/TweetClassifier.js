"use strict";
var path = require('path');
var fs = require('fs');
var stopListPath = path.join(__dirname, 'stop_list.txt');
var stopList = fs.readFileSync(stopListPath).toString().split('\n');

function convertCsvToObject(lines) {
  var holdingObject = {};
  lines.forEach(function(line) {
    var words = line.match(/\b(\w+)\b/g);

    words.forEach(function(word) {
      word = word.toLowerCase();
      if (stopList.indexOf(word) > -1) {
        return;
      }

      if (word[0] === word[0].toUpperCase()) {
        return;
      }

      if (holdingObject[word]) {
        holdingObject[word]++;
      } else {
        holdingObject[word] = 1;
      }
    });

  });

  return holdingObject;

}


function TweetClassifier() {
  this.weights = {};
  this.totals = {};
}

TweetClassifier.prototype.train = function(train, label) {
  var total = 0;
  var weights = {};
  for (var word in train) {
    if (train.hasOwnProperty(word)) {
      var freq = train[word];
      total += freq;
      weights[word] = freq;
    }
  }

  this.weights[label] = weights;
  this.totals[label] = total;
};

TweetClassifier.prototype.calcProbability = function(freq, label) {
  // console.log(label, freq, this.totals);
  // msmk
  return (freq + 1) / (this.totals[label] + 2);
};

TweetClassifier.prototype.classify = function(tweet, classes) {
  classes = classes || ['transfers', 'football'];
  var probs = {};
  var that = this;
  classes.forEach(function(cls) {
    var prob = 0.5;
    var words = tweet.match(/\b(\w+)\b/g);
    words.forEach(function(word) {
      word = word.toLowerCase();
      if (stopList.indexOf(word) > -1) {
        return;
      }

      if (word[0] === word[0].toUpperCase()) {
        return;
      }

      var freq = that.weights[cls][word] || 0;
      prob *= that.calcProbability(freq, cls);
    });
    probs[cls] = prob;
  });
  return probs;
};

TweetClassifier.getClassifier = function(){
  var weightsFile = 'weights.csv';

  var classifier = new TweetClassifier();

  if (fs.existsSync(weightsFile)) {
    // Will add caching
    // var weights = fs.readFileSync(weightsFile);
  } else {
    var transferCsvPath = path.join(__dirname, 'transferTweets.csv');
    var transferTweets = fs.readFileSync(transferCsvPath)
                                .toString().split('\n');
    var footballCsvPath = path.join(__dirname, 'footballTweets.csv');
    var footballTweets = fs.readFileSync(footballCsvPath)
                                .toString().split('\n');

    // var test = transferTweets.splice(-20)
    // var testTransfer = transferTweets.slice(-20);
    // transferTweets = transferTweets.slice(0, -20);

    // var testFootball = footballTweets.slice(-20);
    // footballTweets = footballTweets.slice(0, -20);

    var transfers = convertCsvToObject(transferTweets);
    var football = convertCsvToObject(footballTweets);

    classifier.train(transfers, 'transfers');
    classifier.train(football, 'football');
  }
  return classifier;
};

// TweetClassifier.pretrained = classifier;
// var res = classifier.classify(test[0], ['transfers', 'football']);

// var correct = 0;
// var total = 0;
//
// testTransfer.forEach(function(t) {
//   var probs = classify(t, ['transfers', 'football']);
//   correct += probs.transfers > probs.football;
//   total++;
// });

// console.log('Transfers: ', correct / total);
//
// var correct = 0;
// var total = 0;
//
// testFootball.forEach(function(t) {
//   var probs = TweetClassifier.pretrained.classify(t);
//   correct += probs.transfers < probs.football;
//   total++;
// });


// classifier = require('TweetClassifier').pretrained
// classifier.classify(tweet)
// ratio = classifier.transfer / classifier.football
// isTransfer = ratio > threshold
module.exports = TweetClassifier;
