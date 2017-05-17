//A list of useful keycodes
var Key = {
  BACKSPACE: 8,
  DELETE: 46,
  TAB: 9,
  ENTER: 13,
};

//Adds default tags to the input boxes
function addDefaultTags() {
  $('#players').materialtags('add', 'Wayne Rooney');
  $('#players').materialtags('add', '@waynerooney');
  $('#clubs').materialtags('add', 'West Ham');
  $('#clubs').materialtags('add', '@WestHamUtd');
}

//Animates and reveals the "back to top" button
function showBackToTopButton() {
  $('#back-to-top').css('display', 'initial');
  $('#back-to-top').stop().animate({
    bottom: '20px',
    opacity: '1'
  },
  {
    queue: false,
    duration: 50
  });
}

//Animates and hides the "back to top" button
function hideBackToTopButton() {
  $('#back-to-top').stop().animate({
    bottom: '10px',
    opacity: '0'
  },
  {
    queue: false,
    duration: 200
  }).promise().done(function(){
    $('#back-to-top').css('display', 'none');
  });
}

//Applies the suggestions to the input field
//(WIP: CURRENTLY NOT WORKING)
function applySuggestions(input, suggestions) {
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

//Checks whether an input box is empty; if not, cancel
//whatever event and empty the input
function checkEmpty(e, obj) {
  var input = obj.parent().find('.materialize-tags input');
  if (input.val() !== '') {
    e.cancel = true;
    input.empty();
  }
}

//Validation for the form
function validate() {
  //Makes sure all fields have a value before allowing submission
  var tags1 = $('#players').materialtags('items').length > 0;
  var tags2 = $('#clubs').materialtags('items').length > 0;
  var checked = $('#options').val().length > 0;
  if (tags1 && tags2 && checked)
    $('#submit-button').prop('disabled', false);
  else
    $('#submit-button').prop('disabled', true);
}

$(document).ready(function() {
  //Helper boolean for detecting whether del or backspace is down
  //(NEEDS IMPROVING!)
  var delIsDown = false;

  //Getting stuff from the DOM
  var $playersLabel = $('#players_label');
  var $clubsLabel = $('#clubs_label');
  var $inputs = $('#players, #clubs');

  //Initialising various things
  addDefaultTags();
  $('.parallax').parallax();
  $('select').material_select();

  //Making sure the labels can be clicked on to select the input boxes
  $playersLabel.click(function(){
    $('.n-tag:first').focus();
  })
  $clubsLabel.click(function(){
    $('.n-tag:eq(1)').focus();
  })

  //Listeners for the input boxes
  $inputs.on('itemRemoved', function() {
	  $(this).parent().find('.materialize-tags input').focus();
    validate();
  });

  $inputs.on('itemAdded', function() {
    validate();
  });

  $inputs.on('beforeItemRemove', function(e) {
    checkEmpty(e, $(this));
  });

  $inputs.on('beforeItemAdd', function(e) {
    if (delIsDown)
      checkEmpty(e, $(this));
  });

  //For each tag, have the following listeners
  $('.n-tag').each(function() {

    //If defocused, empty the text
    $(this).focusout(function() {
      $(this).val("");
    });

    $(this).keydown(function(e) {
      //NEEDS IMPROVING
      if (e.which == Key.BACKSPACE || e.which == Key.DELETE)
        delIsDown = true;

      //Allowing tabbing between input boxes
	    if (e.which === Key.TAB) {
		    if (e.shiftKey && $('.n-tag:eq(1)').is(":focus"))
		      $('.n-tag:first').focus();
        else if ($('.n-tag:first').is(":focus"))
          $('.n-tag:eq(1)').focus();
      }
    });

    $(this).keyup(function(e) {
      if (e.which == Key.BACKSPACE || e.which == Key.DELETE)
        delIsDown = false;
    });

  });

  //Making sure the options drop down is validated
  $('#options').on('change', function(e) {
    validate();
  });

  //Back to top button stuff...
  var hidingBackToTop = false;
  var $top = $('#back-to-top');

  $(window).scroll(function(){
    if ($(this).scrollTop() > 0) {
      if (!hidingBackToTop && $top.css('opacity') == 0)
        showBackToTopButton();
    } else {
      hidingBackToTop = false;
      hideBackToTopButton();
    }
  });

  $top.click(function(){
    hidingBackToTop = true;
    hideBackToTopButton();
    scrollTo($('html').offset().top, 500);
  });

  //Initialising the Bloodhound stuff
  //(WIP: CURRENTLY NOT WORKING)
  var playernames = $.getJSON('/data/players.json', function(data) {

    //Creating a new Bloodhound object
    var playername = new Bloodhound({
      local: data,
      // identify: function(obj) { return obj.id; },
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
    });

    var bhpromise = playername.initialize();

    bhpromise
    .done(applySuggestions($('#players'), playername))
    .fail(function() { console.log('Bloodhound done goofed!'); });

  });

});
