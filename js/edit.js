var params = getJsonFromUrl(true);
var formEditLink, publishLink, number_valid_check = {}, question_validation = {};

/* Called when succesfully signed in */
function signupSuccess() {
  showLoader(true);

  // Make an API call to the People API, and print the user's given name.
  gapi.client.people.people.get({
    'resourceName': 'people/me',
    'requestMask.includeField': 'person.names,person.emailAddresses'
  }).then(function(response) {
    appendPre("Hi, " + response.result.names[0].givenName);

    var params = getJsonFromUrl(true);
    if( !params['petition'] ) {
      alert("This petition not exist!")
      return;
    }
    var formLink = "https://docs.google.com/forms/d/" + params['petition'] + "/edit?usp=sharing";
    callScriptFunction('getPetitionLinks', [formLink], displayEditForm, displayErrorMsg);

  }, function(reason) {
    console.log('Error: ' + reason.result.error.message);
  });
}

function displayEditForm(inRes) {
  formEditLink = inRes["editLink"],
    publishLink = inRes["publishLink"];

  // $("#display-link").html("Your petition edit link (don't share this link with unauthorized): <a href={0}>{1}</a>".format(formEditLink, formEditLink));
  //TODO: refresh with the focus / update the iframe  
                        // 'https://docs.google.com/forms/d/1UMGwXJ285CeUG98eME7sm1aYHBiWNUHsmhps253pPg0/edit'
                        // https://docs.google.com/forms/d/e/1FAIpQLScXsDe_D-q0wv401_x6RhaJzBo6H1o262khETRsQsullplAzw/viewform?usp=sf_link
                        // url.split("/viewform")[0] + "viewform?embedded=true/edit"\


  $("#input_edit_signature").attr("onclick", "window.open('" + formEditLink +"')")
          .show();
  var display_link = publishLink.split("/viewform")[0] + "/viewform?embedded=true/edit";
  var form_iframe = '<iframe src='+ display_link + ' width="700" height="520" frameborder="0" marginheight="0" marginwidth="0">Loading...</iframe>';
  $("#signature-container").html(form_iframe);

  /* load petition content */ 
  var contentsRef = firebase.database().ref("petition/" + params['petition'] + "/contents");
  // petition/[petitionID]

  contentsRef.once("value").then(function(snapshot) {
    var contents = snapshot.val();
    setContents(editor, contents);
  });


  callScriptFunction('getQuestions', [formEditLink], displayQuestions, displayErrorMsg);

  $(".authorize-only").show();
  
  // initialize_materialize_css();
  initListener();

  showLoader(false);
} 

function displayQuestions(inRes) {
  var questionRef = firebase.database().ref("petition/" + params['petition'] + "/question");
  // petition/[petitionID]

  questionRef.once("value").then(function(snapshot) {
    var geo_id = firebase.database().ref("petition/" + params["petition"] + "/geolocation-id");
    geo_id.once("value").then(function(geoid) {
      
      var questions = snapshot.val() ? snapshot.val() : [];
      var data_to_update = [];
      var onSuccess = function() {};

      console.log(questions);

      // TODO if inRes is not at DB yet, then add. 
      var questionID = [], question_isPublic = {};
      for(var key in questions) {
        questionID.push( questions[key].id );
        question_isPublic[questions[key].id] = questions[key]["done"];
      }

      if(!EQ(questionID, Object.keys(inRes))) onSuccess = function() {location.reload();};

      var index = 0;

      for (var key in inRes) {
        if(geoid.val() && key == geoid.val()) continue;

        if( !questionID.includes(key) )
          data_to_update.push( {"done": true, "title": inRes[key], "id": key} );
        else {
          data_to_update.push( {"done": question_isPublic[key], "title": inRes[key], "id": key} );
        } 
      } 

      setDB("petition/" + params['petition'] + "/question", data_to_update, onSuccess);

      // attach tag buttons 
      $("#tag-select-options-container").empty();
      $("#tag-select-options-container").append( '<button class="waves-effect waves-light btn-small white" onclick="$({0}).tagEditor({1}, {2});" style="color:black;">add Textbox</button>'.format("'#tag-editor-textarea'", "'addTag'", "'|textbox|'"));
      for (var key in inRes) {
        $("#tag-select-options-container").append( "<br>" );
        var label = '<label>{0}</label> '.format(inRes[key]);
        $("#tag-select-options-container").append( label );
        question_validation[inRes[key].toLowerCase()] = false;

        $.each(["Min of field ", "Max of field ", "Average of field ", "% bigger than textbox value of field ", "% smaller than textbox value of field "], function( index, value ) {
          var add_tag_btn = '<button onclick="$({0}).tagEditor({1}, {2});" class="waves-effect waves-light btn-small blue" question-id={4}>{3}</button>'.format("'#tag-editor-textarea'", "'addTag'","'|" + value + inRes[key] + "|'", value, key);
          $("#tag-select-options-container").append( add_tag_btn );
        });
        
        // inRes[key]


      } 
      
    });
  });
}

function initListener() {

  $(document).on('click', '.mv-save', function() {
    // Save contetns to DB. 
    setDB("petition/" + params["petition"] + "/contents", getContents(editor));
  });

  $(document).on('click', "#question-update-btn", function() {
    showLoader(true);
    callScriptFunction('getQuestions', [formEditLink], function(inRes) { displayQuestions(inRes); showLoader(false); }, displayErrorMsg);
  });

  var geo_id = firebase.database().ref("petition/" + params["petition"] + "/geolocation");
  geo_id.once("value").then(function(geo_snapchat) {
    if(geo_snapchat.val()) $('#geo-input').attr("checked", "");
    else $('#geo-input').removeAttr("checked");
  });

  /* If user changes the setting for geolocation */
  $('#geo-input').change(function(){
    if($(this).is(':checked')){
      setDB("petition/" + params["petition"] + "/geolocation", true);
        // Add location question to the survey
      callScriptFunction('addQuestion', [formEditLink, "Your current location (auto-complete)"], function(inRes) {
        setDB("petition/" + params["petition"] + "/geolocation-id", inRes.id);}
        , displayErrorMsg);
    }
    else {
      setDB("petition/" + params["petition"] + "/geolocation", false);
      var geo_id = firebase.database().ref("petition/" + params["petition"] + "/geolocation-id");
        debugger;
        geo_id.once("value").then(function(geo_snapchat) {
          if(geo_snapchat.val()){

            callScriptFunction('removeQuestion', [formEditLink, geo_snapchat.val()], function(inRes) {}, displayErrorMsg);
          }
        });
    }
  });

  var scaffolder = firebase.database().ref("petition/" + params["petition"] + "/scaffolder/tags");
  scaffolder.once("value").then(function(snapshot) {
    var init_tag = snapshot.val() ? snapshot.val() : ['|Average of FIELD field1|', 'of us are experiencing lower than', '|textbox|'];
    // Tag editor init
    $('#tag-editor-textarea').tagEditor({ initialTags: init_tag, placeholder: '',
      onChange: function(field, editor, tags) {
        console.log(field, editor, tags);

        tag_classes(field, editor, tags);
      }
    });
    // init
    tag_classes("", "","");

      $(document).on('click', '#scaffolder-open-btn', function() {
        // Save scafollder to DB
        setDB("petition/" + params["petition"] + "/scaffolder", {"html": $("#tag-preview-container").html(), "tags": $('#tag-editor-textarea').tagEditor('getTags')[0].tags});
      });
  });

  

  $('#remove_all_tags').click(function() {
      var tags = $('#tag-editor-textarea').tagEditor('getTags')[0].tags;
      for (i=0;i<tags.length;i++){ $('#tag-editor-textarea').tagEditor('removeTag', tags[i]); }
  });

  function tag_classes(field, editor, tags) {
      $("#tag-preview-container").empty();
      $("#tag-error-msg").empty();

      var story_preview = "";

      $('.tag-editor li').each(function(){
          var li = $(this);
          if (li.find('.tag-editor-tag').length == 0) return;

          if (li.find('.tag-editor-tag').html().includes('|textbox|')) {
            if(tags.includes('|textbox|')) 
              story_preview += '<input type="text" placeholder="Write your number here" style="width:200px;"/>';
            // li.find('.tag-editor-tag').html('<input type="text" placeholder="Write your number here" style="width:200px;"/>');
            li.addClass('white-tag');
          }
          else {
            var text_content = li.find('.tag-editor-tag').html();

            if (li.find('.tag-editor-tag').html().includes('|')) {
              var tag_txt = text_content.split(" of field ")[1].slice(0, -1), tag_id = text_content.split("|id")[1];
            
              console.log(li.find('.tag-editor-tag').html(), tag_txt, tag_id);
              if(!(tag_txt in question_validation)){
                li.addClass('red-tag');

                if(tags.includes(text_content)) 
                  $("#tag-error-msg").append('Warning: The field {0} does not exist. <button onclick="$({1}).tagEditor({2}, {3});" class="waves-effect waves-light btn-small grey">Remove the tag</button><br>'.format(tag_txt, "'#tag-editor-textarea'", "'removeTag'", "'"+ text_content + "'"));
     
              }
              else if(!question_validation[tag_txt]) {
                li.addClass('green-tag');

                if(tags.includes(text_content)) 
                  $("#tag-error-msg").append('Warning: The field {0} might not be numeric. The feature is only supported when the values are numeric. Make sure the field only accepts numeric values <button id="btn-set-numeric" onclick="setQuestionValidation({1}, {2})" class="waves-effect waves-light btn-small grey">Set numeric validation</button><br>'.format(tag_txt, tag_txt, "'number'"));
              }
            }
            else li.removeClass('red-tag green-tag');
            if(tags.includes(text_content)) 
              story_preview += text_content; 
          }
      });

      $("#tag-preview-container").html(story_preview);
  }

  fold_configurations("ingredients");
  fold_configurations("scaffolder");
}

function fold_configurations  (inStep) {
  var $elem_to_hide = $('#container-' + inStep);
  $elem_to_hide.before('<a id="{0}-open-btn" class="chart-editor-btn waves-effect waves-light btn grey">Edit</a>'.format(inStep))
  $elem_to_hide.hide();
  $(document).on('click', '#' + inStep + "-open-btn", () => {
    $elem_to_hide.toggle({
      'duration': 500,
      'done': () => {
        var $chart_editor_btn = $('#' + inStep + "-open-btn");
        if ('Edit' == $chart_editor_btn.text()) {
          $chart_editor_btn.html('Done');
        } else {
          $chart_editor_btn.html('<i class="material-icons green">done</i>');
        }
      }
    });

    var $upper_elem = $("#" + inStep + "-header");
    $('html,body').animate({
      scrollTop: $elem_to_hide.offset().top - $upper_elem.height() - $('#' + inStep + "-open-btn").height(),
    });
  })
}

function setQuestionValidation(questionID, type) {
  console.log(questionID, type);
  callScriptFunction('setQuestionValidation', [formEditLink, questionID, type], function(inRes) { $("#btn-set-numeric").html('<i class="material-icons green">done</i>'); number_valid_check[questionID] = true;}, function() {$("#btn-set-numeric").html('<span class="red">Error while set the validation</span>')});
}

function routeToDashboard() {
  var params = getJsonFromUrl(true);

  window.location.href = './dashboard.html?petition=' + params['petition'];
}