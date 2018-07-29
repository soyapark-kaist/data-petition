var SIGNATURE_DATA = [], 
  CATEGORY = [];          // List of a field at the form which is not numeric value. 

var GRAPH_TYPE = [["pie", "network"],
                  ["bar", "line"],    // Need at least one numeric fields
                  ["scatter", "area"]] // Need two at least two numeric fields 

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
    callScriptFunction('getSignatures', [formLink], initSignatureSummary);
  }, function(reason) {
    console.log('Error: ' + reason.result.error.message);
  });
}

function initSignatureSummary(inRes) {
  console.log(inRes);

  $("#participants-number").text(inRes.length);

  SIGNATURE_DATA = inRes;

  checkAvailableGraphTypes(); 

  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(function() {prepareVizInterface("pie"); drawChart("pie", CATEGORY[0])}); // Show a basic graph initially

  initListener();

  showLoader(false);
} 

function initListener() {

  $('select.select-category').on('change', function() {
    drawChart( $(this).parent()[0].getAttribute('graph-type'), this.value );
  })
}

function checkAvailableGraphTypes() {
  computeCategory();
  var numeric_field_cnt = Object.keys( SIGNATURE_DATA[SIGNATURE_DATA.length - 1] ).length - CATEGORY.length;

  $(".option-graph-type").hide();

  $(".option-graph-type").each(function(index) {
    if( $(this).attr("graph-required-numeric") <= numeric_field_cnt ) 
      $(this).show();
  });
}

function computeCategory() {
  for(var key in SIGNATURE_DATA[SIGNATURE_DATA.length - 1]) {
    if( !isFieldNumeric(key) )
      CATEGORY.push(key);
  }
}

function getFieldVal(inField) {
  var arr = []
  for(var i = 0; i < SIGNATURE_DATA.length; i++) {
    if( !(inField in SIGNATURE_DATA[i]) ) continue;

    arr.push(SIGNATURE_DATA[i][inField]);
  }
  
  return arr;
}

function isFieldNumeric(inField) {
  var arr = getFieldVal(inField);

  return !(arr.map(x => (parseFloat(x))).includes(NaN));
}


function displayGraph(inGraphType, inFieldArray) {
  var required_numeric_fields = 0;

  // for (var i =0;i < GRAPH_TYPE.length; i++) {
  //   if (GRAPH_TYPE[i].includes( inGraphType )) {
  //     required_numeric_fields = i;
  //     break;
  //   }
  // }

  var numeric_field_cnt = 0;
  for(var i =0;i < SIGNATURE_DATA[0].length; i++) {
    if( isFieldNumeric(i) )
      numeric_field_cnt ++;
  }
}

function prepareVizInterface(inGraphType) {
  $(".select-category").empty();
  $(".select-category").show();

  for (var i in CATEGORY)
    $("#{0}-interface .select-category".format(inGraphType)).append( "<option value='{0}'>{1}</option>".format(CATEGORY[i], CATEGORY[i]) );
}

function drawChart(inGraphType, inField) {
  // If it's count
  var graphData = [[inField, 'Count for each ' + inField]];
  var arr = getFieldVal(inField);
  var counts = {};

  for (var i = 0; i < arr.length; i++) {
    var val = arr[i];
    counts[val] = counts[val] ? counts[val] + 1 : 1;
  }

  for (var key in counts) {
    graphData.push([key, counts[key]]);
  }

  var chart;
  var data = google.visualization.arrayToDataTable( graphData );

  /*([
    ['Task', 'Hours per Day'],
    ['Work',     11],
    ['Eat',      2],
    ['Commute',  2],
    ['Watch TV', 2],
    ['Sleep',    7]
  ]);*/

  if( inGraphType == "pie") {
    var chart = new google.visualization.PieChart(document.getElementById('chart-container'));
  }
  

  var options = {
      title: inField
  };
  chart.draw(data, options);
}

String.prototype.format = function() {
    var formatted = this;
    for( var arg in arguments ) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};
