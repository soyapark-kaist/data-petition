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
    callScriptFunction('getSignatures', [formLink], displaySignatureSummary);
  }, function(reason) {
    console.log('Error: ' + reason.result.error.message);
  });
}

function displaySignatureSummary(inRes) {
  console.log(inRes);

  $("#participants-number").text(inRes.length);

  showLoader(false);
} 