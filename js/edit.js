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

  });

  $(".authorize-only").show();
  
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
}

function updateDB(inRef, inData, inOnSuccess) {
  var playersRef = firebase.database().ref(inRef);
  // users/2017-3-6

  playersRef.update(inData,
      function(error) {
          if (error) {
              console.log(error);
          } else {
              inOnSuccess();
          }

      });
}

function setDB(inRef, inData, inOnSuccess=function() {}) {
  var playersRef = firebase.database().ref(inRef);
  // users/2017-3-6

  playersRef.set(inData,
      function(error) {
          if (error) {
              console.log(error);
          } else {
              console.log("push to DB", inData);
              inOnSuccess();
          }

      });
}

function routeToDashboard() {
  var params = getJsonFromUrl(true);

  window.location.href = './dashboard.html?petition=' + params['petition'];
}