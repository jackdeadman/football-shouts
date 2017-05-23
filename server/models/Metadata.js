'use strict';

var xml2js = require('xml2js');
// var wikidataSdk = require('wikidata-sdk');
var SparqlClient = require('sparql-client');
var endpoint = "https://query.wikidata.org/bigdata/namespace/wdq/sparql";

var client = new SparqlClient(endpoint);

module.exports.getPlayerClubWikidata = (playerName) => {
  var query = 'PREFIX wd: <http://www.wikidata.org/entity/> ' +
              'PREFIX wdt: <http://www.wikidata.org/prop/direct/> ' + 
              'SELECT DISTINCT ?player ?playerLabel ?teamLabel ?positionLabel ?imageURL ?twitterUsername WHERE {' +
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
                  'OPTIONAL {?player wdt:P18 ?imageURL}. ' +
                  'OPTIONAL {?player wdt:P2002 ?twitterUsername}. ' +
              '} ORDER BY ?startTime ';


  console.log(query);
  return new Promise((resolve, reject) => {
    client.query(query)
    .execute(function(error, results) {
      if (!error && results) {
        xml2js.parseString(results, (error, parsedResults) => {
          if (error || !parsedResults) {
            reject(error);
          } else {
            var name = parsedResults.sparql.results[0].result[0].binding[1].literal[0]._;
            var teamNames = new Set();
            var positions = new Set();
            var innerResults = parsedResults.sparql.results[0].result;
            var imageURL = null;
            var twitterUsername = null;
            if (innerResults) {
              for (var i = 0; i < innerResults.length; i++) {
                var team = innerResults[i].binding[2].literal[0]._;
                var position = innerResults[i].binding[3].literal[0]._;
                if (innerResults[i].binding.length > 5) {
                  imageURL = innerResults[i].binding[4].uri[0];
                  twitterUsername = innerResults[i].binding[5].literal[0];
                } else if (innerResults[i].binding.length > 4) {
                  imageURL = innerResults[i].binding[4].uri[0];
                }
                
                teamNames.add(team);
                positions.add(position);
              }
            }
            
            resolve({name, teamNames, positions, imageURL, twitterUsername});
          }
        });
      }
    });
  });
};
