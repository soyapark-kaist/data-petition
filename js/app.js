// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://script.googleapis.com/$discovery/rest?version=v1", "https://people.googleapis.com/$discovery/rest?version=v1"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/script.projects https://www.googleapis.com/auth/forms https://www.googleapis.com/auth/script.send_mail https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email profile';

var authorizeButton = document.getElementById('authorize_button'),
  googleSigninButton = document.getElementById('btn_google_signin');
var signoutButton = document.getElementById('signout_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient(res) {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    if (googleSigninButton)
      googleSigninButton.onclick = handleAuthClick;

    signoutButton.onclick = handleSignoutClick;
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    $("#content").show();

    $("#msg_request_login").hide();
    $("#btn_google_signin").hide();

    $("#main-area").show();

    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';

    signupSuccess();
  } else {
    $("#content").hide();

    $("#msg_request_login").show();

    $("#main-area").hide();

    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
  window.location.href = '/';
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

var scriptId = "1LkBObf9fn_8dylXxoYp0A53aUYkjHoRYWeVbMvkdfybJK6UA2FpoPR1L";

function checkAuthority() {
  callScriptFunction('getEditors', [response.result.emailAddresses[0].value], displayEditForm, displayErrorMsg);
}

function callScriptFunction(inFunctionName, inParams, inOnSuccess, inOnFail) {
  gapi.client.script.scripts.run({
    'scriptId': scriptId,
    'resource': {
      'function': inFunctionName,
      "parameters": inParams
    }
  }).then(function(resp) {
    var result = resp.result;
    if (result.error && result.error.status) {
      // The API encountered a problem before the script
      // started executing.
      console.log('Error calling API:');
      console.log(JSON.stringify(result, null, 2));
      inOnFail(result.response.result);
    } else if (result.error) {
      // The API executed, but the script returned an error.

      // Extract the first (and only) set of error details.
      // The values of this object are the script's 'errorMessage' and
      // 'errorType', and an array of stack trace elements.
      var error = result.error.details[0];
      console.log('Script error message: ' + error.errorMessage);

      if (error.scriptStackTraceElements) {
        // There may not be a stacktrace if the script didn't start
        // executing.
        console.log('Script error stacktrace:');
        for (var i = 0; i < error.scriptStackTraceElements.length; i++) {
          var trace = error.scriptStackTraceElements[i];
          console.log('\t' + trace.function + ':' + trace.lineNumber);
        }
      }

      inOnFail(error.errorMessage);
    } else {
      inOnSuccess(result.response.result);
    }
  });
}
// [END apps_script_execute]

function displayErrorMsg(inRes) {
  $(".section .container").html('<h1 class="header center orange-text">Something went wrong :(</h1>');

  if ( inRes.includes("No item with the given ID could be found, or you do not have permission to access it.") )
    $(".section .container").append('<h5 class="header col s12 light">No item with this petition URL could be found, or you do not have permission to access it.</h5>');

  showLoader(false);
}

function displayRequestLogin(inRes) {

}

function getJsonFromUrl(hashBased) {
  var query;
  if(hashBased) {
    var pos = location.href.indexOf("?");
    if(pos==-1) return [];
    query = location.href.substr(pos+1);
  } else {
    query = location.search.substr(1);
  }
  var result = {};
  query.split("&").forEach(function(part) {
    if(!part) return;
    part = part.split("+").join(" "); // replace every + with space, regexp-free version
    var eq = part.indexOf("=");
    var key = eq>-1 ? part.substr(0,eq) : part;
    var val = eq>-1 ? decodeURIComponent(part.substr(eq+1)) : "";
    var from = key.indexOf("[");
    if(from==-1) result[decodeURIComponent(key)] = val;
    else {
      var to = key.indexOf("]",from);
      var index = decodeURIComponent(key.substring(from+1,to));
      key = decodeURIComponent(key.substring(0,from));
      if(!result[key]) result[key] = [];
      if(!index) result[key].push(val);
      else result[key][index] = val;
    }
  });
  return result;
}

String.prototype.format = function() {
    var formatted = this;
    for( var arg in arguments ) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};
const SUM = arr => arr.reduce((a,b) => a + b, 0);
const MIN = arr => arr.reduce((min, p) => p < min ? p : min, data[0]);
const MAX = arr => arr.reduce((max, p) => p > max ? p : max, data[0]);
const AVER = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;