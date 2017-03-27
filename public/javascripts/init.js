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
  addDefaultTags();

  //Input guff
  $('#players_label').click(function(){
    $('.n-tag:first').focus();
  })

  $('#clubs_label').click(function(){
    $('.n-tag:eq(1)').focus();
  })

  $('.n-tag').each(function(){

    //If defocused, empty the text
    $(this).focusout(function(){
      $(this).val("");
    });

    $(this).keyup(function(e){
      if (e.which == 9) {
        if ($('.n-tag:first').is(":focus"))
          $('.n-tag:eq(1)').focus();
      }
    });

    //If del is pressed, make sure box stays focused (not working? whyyyy)
    // $(this).keyup(function(e){
    //   if(e.keyCode == 8 || e.keyCode == 46) {
    //     console.log("Here");
    //     $(this).focus();
    //   }
    // });
  });



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
