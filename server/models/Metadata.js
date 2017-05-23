'use strict';

var wdk = require('wikidata-sdk');
var requestPromise = require('request-promise');

module.exports.getPlayerClubWikidata = (playerName) => {
  var query = 'PREFIX wd: <http://www.wikidata.org/entity/> ' +
              'PREFIX wdt: <http://www.wikidata.org/prop/direct/> ' + 
              'SELECT DISTINCT ?player ?playerLabel ?teamLabel ?positionLabel ?imageURL ?twitterUsername ?dateOfBirth ?shirtNumber WHERE {' +
                  'hint:Query hint:optimizer "None". ' +
                  '?player wdt:P106 wd:Q937857. ' + 
                  '?player wdt:P31 wd:Q5. ' +
                  '?player rdfs:label ?playerLabel FILTER regex(?playerLabel, "' + playerName + '", "i").' +
                  '?player p:P54 ?teamList. ' +  
                  '?teamList ps:P54 ?team. ' +
                  '?team wdt:P31 wd:Q476028. ' +
                  'OPTIONAL {?teamList pq:P582 ?endTime}.' +
                  'FILTER (!BOUND(?endTime) || ?endTime > NOW()). ' +
                  '?teamList pq:P580 ?startTime. ' +
                  '?team rdfs:label ?teamLabel FILTER (LANG(?teamLabel) = "en").' +
                  '?player rdfs:label ?playerLabel FILTER (LANG(?playerLabel) = "en"). ' +
                  '?team rdfs:label ?teamLabel FILTER (LANG(?teamLabel) = "en"). ' +
                  '?player p:P413 ?positionList. ' +
                  '?positionList ps:P413 ?position. ' +
                  '?position rdfs:label ?positionLabel FILTER (LANG(?positionLabel) = "en"). ' +
                  '?player wdt:P569 ?dateOfBirth. ' +
                  '?player wdt:P1618 ?shirtNumber. ' +
                  'OPTIONAL {?player wdt:P18 ?imageURL}. ' +
                  'OPTIONAL {?player wdt:P2002 ?twitterUsername}. ' +
              '} ORDER BY ?startTime ';

  var url = wdk.sparqlQuery(query);

  return new Promise((resolve, reject) => {
    requestPromise(url)
    // .then(wdk.simplifySparqlResults)
    .then(JSON.parse)
    .then((results) => {
      var bindings = results.results.bindings;
      if (bindings[0]) {
        var name = bindings[0].playerLabel.value;
        var positions = new Set();
        var teamName;
        var imageUrl;
        var twitterUsername;
        var dateOfBirth;
        var shirtNumber;
        bindings.forEach((result) => {
          var resultName = result.playerLabel.value;
          if (resultName === name) {
            teamName = result.teamLabel.value;
            dateOfBirth = result.dateOfBirth.value;
            shirtNumber = result.shirtNumber.value;
            var position = result.positionLabel.value;
            positions.add(position);
            if (result.imageURL) {
              imageUrl = result.imageURL.value;
            }
            if (result.twitterUsername) {
              twitterUsername = result.twitterUsername.value;
            }
          }
        });
        resolve({name, teamName, positions, imageUrl, twitterUsername, dateOfBirth, shirtNumber});
      } else {
        reject("No results from wikidata.");
      }
    })
    .catch((err) => {
      reject(err);
    });
  });
  
};
