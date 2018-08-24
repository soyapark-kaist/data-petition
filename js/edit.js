var params = getJsonFromUrl(true);
var formEditLink, publishLink;

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

  callScriptFunction('getQuestions', [formEditLink], displayQuestions, displayErrorMsg);
} 

function displayQuestions(inRes) {
  /* load petition content */ 
  var contentsRef = firebase.database().ref("petition/" + params['petition'] + "/contents");
  // petition/[petitionID]

  contentsRef.once("value").then(function(snapshot) {
    var contents = snapshot.val();
    setContents(editor, contents);
  });

  var questionRef = firebase.database().ref("petition/" + params['petition'] + "/question");
  // petition/[petitionID]

  questionRef.once("value").then(function(snapshot) {
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
      if( !questionID.includes(key) )
        data_to_update.push( {"done": true, "title": inRes[key], "id": key} );
      else {
        data_to_update.push( {"done": question_isPublic[key], "title": inRes[key], "id": key} );
      } 
    } 

    setDB("petition/" + params['petition'] + "/question", data_to_update, onSuccess);

    // attach tag buttons 
    $("#tag-select-options-container").append( '<button class="waves-effect waves-light btn-small white" onclick="$({0}).tagEditor({1}, {2});" style="color:black;">add Textbox</button>'.format("'#tag-editor-textarea'", "'addTag'", "'|textbox|'"));
    for (var key in inRes) {
      var add_tag_btn = '<button onclick="$({0}).tagEditor({1}, {2});" class="waves-effect waves-light btn-small blue">add {3}</button>'.format("'#tag-editor-textarea'", "'addTag'","'|" +inRes[key] + "|'", inRes[key]);
      $("#tag-select-options-container").append( add_tag_btn );
      // inRes[key]
    } 
    

  });

  $(".authorize-only").show();
  
  // initialize_materialize_css();
  initListener();

  showLoader(false);
}

function initListener() {

  $(document).on('click', '.mv-save', function() {
    // Save contetns to DB. 
    setDB("petition/" + params["petition"] + "/contents", getContents(editor));
  });



  /* If user changes the setting for geolocation */
  var geolocationSetting = firebase.database().ref("petition/" + params["petition"] + "/geolocation");
  geolocationSetting.on('value', function(snapshot) {
    if (snapshot.val()['collect']) {
      if( !snapshot.val()['id'])
      // Add location question to the survey
      callScriptFunction('addQuestion', [formEditLink, "Your current location (auto-complete)"], function(inRes) {setDB("petition/" + params["petition"] + "/geolocation/id", inRes.id);}, displayErrorMsg);


    } else {
      // remove the location question from the survey
      if(snapshot.val()['id'])
        callScriptFunction('removeQuestion', [formEditLink, snapshot.val()['id']], function(inRes) { firebase.database().ref("petition/" + params["petition"] + "/geolocation/id").remove();}, displayErrorMsg);
    }
    
  });

  $('input:checkbox').change(function(){
    if($(this).is(':checked')){
        var questionID = $($(this).siblings('span')[1]).text();

    }
  });

  // Tag editor init
  $('#tag-editor-textarea').tagEditor({ initialTags: ['|COUNT of FIELD1|', 'of us are experiencing lower than', '|textbox|'], placeholder: '',
    onChange: function(field, editor, tags) {
      $("#tag-preview-container").empty();

      var story_preview = ""
      for(var i =0; i < tags.length; i++) {
        if (tags[i] == "|textbox|") story_preview += '<input type="text" placeholder="Write your number here" style="width:200px;"/>';
        else story_preview += (tags[i] + " ");
      }

      $("#tag-preview-container").html(story_preview);

      tag_classes(field, editor, tags);
    }
  });
  // init
  tag_classes("", "","");

  $('#remove_all_tags').click(function() {
      var tags = $('#tag-editor-textarea').tagEditor('getTags')[0].tags;
      for (i=0;i<tags.length;i++){ $('#tag-editor-textarea').tagEditor('removeTag', tags[i]); }
  });

  function tag_classes(field, editor, tags) {
      $('.tag-editor li').each(function(){
          var li = $(this);
          if (li.find('.tag-editor-tag').length == 0) return;

          if (li.find('.tag-editor-tag').html().includes('|textbox|')) li.addClass('white-tag');
          else if (li.find('.tag-editor-tag').html().includes('|')) li.addClass('green-tag');
          // else if (li.find('.tag-editor-tag').html() == 'green') li.addClass('green-tag')
          else li.removeClass('red-tag green-tag');
      });
  }
}

function routeToDashboard() {
  var params = getJsonFromUrl(true);

  window.location.href = './dashboard.html?petition=' + params['petition'];
}