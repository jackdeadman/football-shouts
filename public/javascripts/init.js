function addDefaultTags() {
  $('#players').materialtags('add', 'Wayne Rooney');
  $('#players').materialtags('add', '@waynerooney');
  $('#clubs').materialtags('add', 'Brighton');
  $('#clubs').materialtags('add', '@brighton');
}

function applySuggestions(input, suggestions) {
  // console.log(suggestions.get(1));

  input.materialtags({
    typeaheadjs: [
    {
  		highlight : true,
  	},
    {
      name: 'playername',
      displayKey: 'name',
      valueKey: 'name',
      source: suggestions.ttAdapter()
    }]
  });
  console.log('Bloodhound initialised and applied!');
}

$(document).ready(function() {
  //Initialising the inputs with some tags
  // addDefaultTags();

  var playernames = $.getJSON('/data/players.json', function(data) {
    console.log(data);

    var playername = new Bloodhound({
      local: data,
      // identify: function(obj) { return obj.id; },
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
    });

    console.log(playername.get("Jim"));

    var bhpromise = playername.initialize();

    bhpromise
    .done(applySuggestions($('#players'), playername))
    .fail(function() { console.log('Bloodhound done goofed!'); });

  });

});
