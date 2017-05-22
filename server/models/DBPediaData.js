'use strict';

var xml2js = require('xml2js');

var SparqlClient = require('sparql-client');
var endpoint = "https://query.wikidata.org/bigdata/namespace/wdq/sparql";

var client = new SparqlClient(endpoint);

module.exports.getPlayerClubWikidata = (playerName) => {
  console.log("in wikidata function");

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
  // https://query.wikidata.org/#SELECT%20DISTINCT%20%3FplayerLabel%20%3FteamLabel%20%3FpositionLabel%20WHERE%20%7B%0A%20%20hint%3AQuery%20hint%3Aoptimizer%20%22None%22.%0A%20%20%3Fplayer%20wdt%3AP106%20wd%3AQ937857.%0A%20%20%3Fplayer%20wdt%3AP31%20wd%3AQ5.%0A%20%20%3Fplayer%20rdfs%3Alabel%20%3FplayerLabel%20FILTER%20regex%28%3FplayerLabel%2C%20%22hazard%22%2C%20%22i%22%29.%0A%20%20%23%3Fplayer%20rdfs%3Alabel%20%22Alexis%20S%C3%A1nchez%22%40en.%0A%20%20%3Fplayer%20p%3AP54%20%3FteamList.%0A%20%20%3FteamList%20ps%3AP54%20%3Fteam.%0A%20%20%3Fteam%20wdt%3AP31%20wd%3AQ476028.%0A%20%20OPTIONAL%20%7B%3FteamList%20pq%3AP582%20%3FendTime%7D.%0A%20%20FILTER%20%28%21BOUND%28%3FendTime%29%20%7C%7C%20%3FendTime%20%3E%20NOW%28%29%29.%0A%20%20%3FteamList%20pq%3AP580%20%3FstartTime.%0A%20%20%23FILTER%20NOT%20EXISTS%20%7B%3FteamList%20pq%3AP582%20%3FendTime.%7D%0A%20%20%3Fteam%20rdfs%3Alabel%20%3FteamLabel%20FILTER%20%28LANG%28%3FteamLabel%29%20%3D%20%22en%22%29.%0A%20%20%3Fplayer%20rdfs%3Alabel%20%3FplayerLabel%20FILTER%20%28LANG%28%3FplayerLabel%29%20%3D%20%22en%22%29.%0A%20%20%3Fplayer%20p%3AP413%20%3FpositionList.%0A%20%20%3FpositionList%20ps%3AP413%20%3Fposition.%0A%20%20%3Fposition%20rdfs%3Alabel%20%3FpositionLabel%20FILTER%20%28LANG%28%3FpositionLabel%29%20%3D%20%22en%22%29.%0A%7D%20ORDER%20BY%20%3FstartTime


  console.log(query);
  return new Promise((resolve, reject) => {
    client.query(query)
    .execute(function(error, results) {
      if (!error) {
        xml2js.parseString(results, (error, parsedResults) => {
          if (error) {
            reject(error);
          } else {
            var name = parsedResults.sparql.results[0].result[0].binding[1].literal[0]._;
            var teamNames = new Set();
            var positions = new Set();
            var innerResults = parsedResults.sparql.results[0].result;
            var imageURL = null;
            var twitterUsername = null;
            for (var i = 0; i < innerResults.length; i++) {
              var team = innerResults[i].binding[2].literal[0]._;
              var position = innerResults[i].binding[3].literal[0]._;
              console.log(innerResults[i].binding.length);
              if (innerResults[i].binding.length >= 5) {
                imageURL = innerResults[i].binding[4].uri[0];
                twitterUsername = innerResults[i].binding[5].literal[0];
              } else if (innerResults[i].binding.length >= 4) {
                imageURL = innerResults[i].binding[4].uri[0];
              }
              
              teamNames.add(team);
              positions.add(position);
            }
            console.log(name, teamNames, positions);
            resolve({name, teamNames, positions, imageURL, twitterUsername});
          }
        });
      }
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