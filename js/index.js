var USER_EMAIL = '';

/* Called when succesfully signed in */
function signupSuccess() {
  // Make an API call to the People API, and print the user's given name.
  gapi.client.people.people.get({
    'resourceName': 'people/me',
    'requestMask.includeField': 'person.names,person.emailAddresses'
  }).then(function(response) {
  	$("#btn_create_petition").show();
    appendPre("Hi, " + response.result.names[0].givenName);
    USER_EMAIL = response.result.emailAddresses[0].value;
    
  }, function(reason) {
    console.log('Error: ' + reason.result.error.message);
  });
} 

function createPetition() {
   showLoader(true);

   callScriptFunction('createForm', [USER_EMAIL], routeToPetition);
}

function routeToPetition(inRes) {
	var param = inRes["editLink"].split("/d/")[1].split("/")[0];

	window.location.href = './edit.html?petition=' + param;
}

