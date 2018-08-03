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
  var formEditLink = inRes["editLink"],
      publishLink = inRes["publishLink"];

  $("#display-link").html("Your petition edit link (don't share this link with unauthorized): <a href={0}>{1}</a>".format(formEditLink, formEditLink));
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
  // for (var key in inRes) {
  //   $("#questions-public-setting").append(
  //     '<p><label mv-multiple property=""> <input property="done" type="checkbox" name="questions-public" value="{0}" checked="checked"> <span>{1}</span> </label></p>'.format(inRes[key], inRes[key])
  //   );
  // }

  var params = getJsonFromUrl(true);
  
  // starCountRef.on('value', function(snapshot) {
  //   updateStarCount(postElement, snapshot.val());
  // });

  //var updates = {};
  // updates["/question"]
  // questionRef.update();

  var questionRef = firebase.database().ref("petition/" + params['petition'] + "/question");
  // petition/[petitionID]

  questionRef.once("value").then(function(snapshot) {
    var questions = snapshot.val() ? snapshot.val() : [];
    var data_to_update = {};
    var onSuccess = function() {};

    console.log(questions);
    if(!questions.length) onSuccess = function() {location.reload();};
    // TODO if inRes is not at DB yet, then add. 
    var questionID = [];
    for(var key in questions) {
      questionID.push( questions[key].id );
    }

    var index = questions.length;

    for (var key in inRes) {
      if( !questionID.includes(key) )
        data_to_update[index++] = {"done": true, "title": inRes[key], "id": key};
    } 

    updateDB("petition/" + params['petition'] + "/question", data_to_update, onSuccess);

  });
  
  showLoader(false);
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

function setDB(inRef, inData) {
  var playersRef = firebase.database().ref(inRef);
  // users/2017-3-6
  debugger;

  playersRef.set(inData,
      function(error) {
          if (error) {
              console.log(error);
          } else {
              console.log("push to DB", inData);
              $("#petition-container").attr("mv-app", inRef);
          }

      });
}

function routeToDashboard() {
  var params = getJsonFromUrl(true);

  window.location.href = './dashboard.html?petition=' + params['petition'];
}