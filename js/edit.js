/* Called when succesfully signed in */
function signupSuccess() {
  showLoader(true);

  // Make an API call to the People API, and print the user's given name.
  gapi.client.people.people.get({
    'resourceName': 'people/me',
    'requestMask.includeField': 'person.names,person.emailAddresses'
  }).then(function(response) {
    appendPre("Hi, " + response.result.names[0].givenName);
    //callScriptFunction('createForm', [response.result.emailAddresses[0].value], displayEditForm);

    var params = getJsonFromUrl(true);
    if( !params['petition'] ) {
      alert("This petition not exist!")
      return;
    }
    var formLink = "https://docs.google.com/forms/d/" + params['petition'] + "/edit?usp=sharing";
    callScriptFunction('getPetitionLinks', [formLink], displayEditForm);
    
  }, function(reason) {
    console.log('Error: ' + reason.result.error.message);
  });
}

function displayEditForm(inRes) {
  var formEditLink = inRes["editLink"],
      publishLink = inRes["publishLink"];

  appendPre('\t' + "Your petition edit link (don't share this link with unauthorized): " + formEditLink);

  showLoader(false);
  //TODO: refresh with the focus / update the iframe  
                        // 'https://docs.google.com/forms/d/1UMGwXJ285CeUG98eME7sm1aYHBiWNUHsmhps253pPg0/edit'
                        // https://docs.google.com/forms/d/e/1FAIpQLScXsDe_D-q0wv401_x6RhaJzBo6H1o262khETRsQsullplAzw/viewform?usp=sf_link
                        // url.split("/viewform")[0] + "viewform?embedded=true/edit"\


  $("#input_edit_signature").attr("onclick", "window.open('" + formEditLink +"')")
          .show();
  var display_link = publishLink.split("/viewform")[0] + "/viewform?embedded=true/edit";
  var form_iframe = '<iframe src='+ display_link + ' width="700" height="520" frameborder="0" marginheight="0" marginwidth="0">Loading...</iframe>';
  $("#signature-container").html(form_iframe);
} 

function routeToDashboard() {
  var params = getJsonFromUrl(true);

  window.location.href = './dashboard.html?petition=' + params['petition'];
}