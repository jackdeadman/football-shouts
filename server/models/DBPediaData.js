'use strict';

var xml2js = require('xml2js');

var SparqlClient = require('sparql-client');
var endpoint = "https://query.wikidata.org/bigdata/namespace/wdq/sparql";

var client = new SparqlClient(endpoint);

module.exports.getPlayerClubWikidata = (playerName) => {
  console.log("in wikidata function");
  var query = 'PREFIX wd: <http://www.wikidata.org/entity/> ' +
              'PREFIX wdt: <http://www.wikidata.org/prop/direct/> ' + 
              'SELECT DISTINCT ?player ?playerLabel ?teamLabel ?positionLabel WHERE { ' +
                  'hint:Query hint:optimizer "None". ' +
                  '?player wdt:P106 wd:Q937857. ' + 
                  '?player wdt:P31 wd:Q5. ' +
                  '?player rdfs:label ?playerLabel. ' +
                  'FILTER regex(?playerLabel, "' + playerName + '", "i"). ' +
                  '?player wdt:P54 ?team. ' +
                  '?player wdt:P413 ?position. ' +
                  '?team rdfs:label ?teamLabel FILTER (LANG(?teamLabel) = "en"). ' +
                  '?position rdfs:label ?positionLabel FILTER (LANG(?positionLabel) = "en"). ' +
              '} LIMIT 50';
  
  console.log(query);
  return new Promise((resolve, reject) => {
    client.query(query)
    .execute(function(error, results) {
      xml2js.parseString(results, (error, parsedResults) => {
        if (error) {
          reject(error);
        } else {
          var name = parsedResults.sparql.results[0].result[0].binding[1].literal[0]._;
          var teamNames = new Set();
          var positions = new Set();
          var results = parsedResults.sparql.results[0].result;
          for (var i = 0; i < results.length; i++) {
            var team = results[i].binding[2].literal[0]._;
            var position = results[i].binding[3].literal[0]._;
            teamNames.add(team);
            positions.add(position);
          }
          console.log(name, teamNames, positions);
          resolve({name, teamNames, positions});
        }
      });
    });
  });
};


// var dbpediaClient = require('dbpediaclient');

// var keywords = "Eden Hazard";
// var dbpediaClass = "soccer player";
// dbpediaClient.replyFormat('application/json');
// dbpediaClient.keywordSearch(keywords, dbpediaClass, (results) => {
//   results = JSON.parse(results);
//   var categories = results.results[0].categories;
//   var categorySearches = [];
//   categories.forEach((category) => {
//     var categorySearch = new Promise((resolve, reject) => {
//       dbpediaClient.keywordSearch(category.label, "", (result) => {
//         result = JSON.parse(result);
//         console.log(result.results);
//         if (result.results.length > 0) {
//           if (new RegExp(/List of [a-zA-Z.-0-9\s]* players/, "g").test(result.results[0].label)) {
//             var endIndex = result.results[0].label.indexOf(" players");
//             var clubString = result.results[0].label.slice(8, endIndex);
//             console.log(clubString);
//             // console.log(result.results[0]);
//           }
//         }
        
        
//       });
//     });
//     categorySearches.push(categorySearch);
//   });
//   Promise.all(categorySearches).then(() => {
//     console.log("done");
//   });
// });