var database = require('./Database');
var dbPlayer = database.Player;
var dbClub = database.Club;

var SparqlClient = require('sparql-client');
var endpoint = "https://query.wikidata.org/bigdata/namespace/wdq/sparql";

var client = new SparqlClient(endpoint);

var query = 'PREFIX wd: <http://www.wikidata.org/entity/>' +
            'PREFIX wdt: <http://www.wikidata.org/prop/direct/>' + 
            'SELECT ?player ?playerLabel WHERE { ' +
            '?player wdt:P31 wd:Q5. ' +
            '?player wdt:P106 wd:Q937857. ' + 
            // '?player wdt:P54 wd:Q18656. ' + 
            '?player rdfs:label ?playerLabel. ' +
            'FILTER(?playerLabel = "Wayne Rooney"@en). }';

client.query(query)
.execute(function(error, results) {
  // console.error(error);
  console.log(results);
});

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