var Key = {
  BACKSPACE: 8,
  DELETE: 46,
  TAB: 9,
  ENTER: 13,
};

function addDefaultTags() {
  $('#players').materialtags('add', 'Wayne Rooney');
  $('#players').materialtags('add', '@waynerooney');
  $('#clubs').materialtags('add', 'West Ham');
  $('#clubs').materialtags('add', '@WestHamUtd');
}

function showButton() {
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

function hideButton() {
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

function checkEmpty(e, obj) {
  var input = obj.parent().find('.materialize-tags input');
  if (input.val() !== '') {
    e.cancel = true;
    input.empty();
  }
}

function validate() {
  var tags1 = $('#players').materialtags('items').length > 0;
  var tags2 = $('#clubs').materialtags('items').length > 0;
  var checked = $('#options').val().length > 0;
  if (tags1 && tags2 && checked)
    $('#submit-button').prop('disabled', false);
  else
    $('#submit-button').prop('disabled', true);
}

$(document).ready(function() {
  //lol
  var delIsDown = false;

  //Initialising the inputs with some tags
  addDefaultTags();

  //Input guff
  $('#players_label').click(function(){
    $('.n-tag:first').focus();
  })

  $('#clubs_label').click(function(){
    $('.n-tag:eq(1)').focus();
  })

  var $inputs = $('#players, #clubs');

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

  $('.n-tag').each(function(){
	  console.log(this)


    //If defocused, empty the text
    $(this).focusout(function(){
      $(this).val("");
    });
    $(this).keydown(function(e){
      //I'M SORRY ABOUT THIS
      if (e.which == Key.BACKSPACE || e.which == Key.DELETE)
        delIsDown = true;

	    if (e.which === Key.TAB) {
		    if (e.shiftKey && $('.n-tag:eq(1)').is(":focus"))
		      $('.n-tag:first').focus();
        else if ($('.n-tag:first').is(":focus"))
          $('.n-tag:eq(1)').focus();
      }
    });

    $(this).keyup(function(e){
      if (e.which == Key.BACKSPACE || e.which == Key.DELETE)
        delIsDown = false;
    });

  });

  //Initialising the parallax background
  $('.parallax').parallax();

  //Initialising the drop down menu component
  $('select').material_select();

  $('#options').on('change', function(e) {
    validate();
  });

  //Checking whether at least one option is selected...
  $('#options').on('change', function(){
    console.log($('#options').val());
    if ($('#options').val().length === 0)
      $('#submit-button').prop('disabled', true);
    else
      $('#submit-button').prop('disabled', false);
  });

  //Back to top button stuff...
  var hiding = false;

  var top = $('#back-to-top');

  $(window).scroll(function(){
    if ($(this).scrollTop() > 0) {
      if (!hiding && top.css('opacity') == 0)
        showButton();
    } else {
      hiding = false;
      hideButton();
    }
  });
  $('#back-to-top').click(function(){
    hiding = true;
    hideButton();
    scrollTo($('html').offset().top, 500);
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
