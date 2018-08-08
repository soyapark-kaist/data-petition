var SIGNATURE_DATA = [], 
  CATEGORY = [];          // List of a field at the form which is not numeric value. 

var GRAPH_TYPE = {"scatter": 2, "area": 1, "line": 1, "bar": 1, "pie": 0};

$( document ).ready(function() {
  initPetition();
});

/* Called when succesfully signed in */
function signupSuccess() {
  // Make an API call to the People API, and print the user's given name.
  gapi.client.people.people.get({
    'resourceName': 'people/me',
    'requestMask.includeField': 'person.names,person.emailAddresses'
  }).then(function(response) {
    appendPre("Hi, " + response.result.names[0].givenName);
 
    $(".authorize-only").show();

  }, function(reason) {
    console.log('Error: ' + reason.result.error.message);
  });
}

function initPetition() {
  var params = getJsonFromUrl(true);
  if( !params['petition'] ) {
    alert("This petition not exist!")
    return;
  }
  var formLink = "https://docs.google.com/forms/d/" + params['petition'].split("#")[0] + "/edit?usp=sharing";
  // callScriptFunction('getSignatures', [formLink], initSignatureSummary, displayErrorMsg);

  var p = {'func': 'getSignatures', 'pid': params['petition'], 'callback': 'initSignatureSummary'};
  get(p);

  /* load petition content */ 
  var questionRef = firebase.database().ref("petition/" + params['petition'] + "/contents");
  // petition/[petitionID]

  questionRef.once("value").then(function(snapshot) {
    var contents = snapshot.val();
    setContents(editor, contents);
  });

  showLoader(false);
}
    
function initSignatureSummary(inRes) {
  console.log(inRes);

  SIGNATURE_DATA = inRes.signature;
  $("#btn_sign_petition").attr("onclick", "window.open('" + inRes['publishLink'] +"')");

  var params = getJsonFromUrl(true);
  var questionRef = firebase.database().ref("petition/" + params['petition'] + "/goal");
  // petition/[petitionID]

  questionRef.once("value").then(function(snapshot) {
    var goal = parseInt(snapshot.val()) ? parseInt(snapshot.val()) : 100;
  
    $("#participants-number").text(SIGNATURE_DATA.length);
    $(".progress .determinate").css("width", (SIGNATURE_DATA.length / goal * 100) + "%");
  });

  google.charts.load('current', {'packages':['corechart']});

  if (SIGNATURE_DATA.length > 0) {
    checkAvailableGraphTypes(); 
    google.charts.setOnLoadCallback(function() {}); // Show a basic graph initially
  } else {
    $(".card").hide();
    $("#msg-no-available-chart").show();
  }

  

  initListener();

  showLoader(false);
} 

function prepareDrawChart( inEvent ) {
  var graph_type = inEvent.parents('.graph-options').attr('graph-type');
  var o = getSelectedOption( graph_type );

  if ( graph_type == "area" || graph_type == "line" || graph_type == "bar") {
    $("#{0}-interface .y-axis div".format(graph_type)).first().attr( "value", o.x[0] );
    $("#{0}-interface .y-axis p".format(graph_type)).first().text( o.x[0] );
  }

  drawChart( graph_type, o.x[0], o.y );
}

function initListener() {
  $(document).on('change', 'select.x-axis, .y-axis input, .y-axis select', function() {
    prepareDrawChart( $(this) );
  });

  var elems = document.querySelectorAll('.modal');
    var instances = M.Modal.init(elems, {
      'onCloseEnd': () => {
        removeHighlightFromCards('orange lighten-4');
      }
    });
    addModalClickEventListener('.modal-trigger', function(event, arguments /* Array */){
      var card = getCardFromClickEvent(event);
      $(card).addClass('orange lighten-4');

      var modal_header = document.getElementsByClassName('modal-header')[0];
      var modal_body = document.getElementsByClassName('modal-body')[0];
      console.log(event);
      console.log(arguments);
      /* Add your codes */

      var graph_type = $(card).attr("graph-type");
      prepareVizInterface( graph_type ); 

      $("#chart-container").empty();

      if(graph_type != "scatter")
        drawChart(graph_type, CATEGORY[0], {"count": true});
    }, 1, 2, 3 /* Arguments */);

  // document.addEventListener('DOMContentLoaded', function() {

  // });
}

function checkAvailableGraphTypes() {
  computeCategory();
  var numeric_field_cnt = Object.keys( SIGNATURE_DATA[SIGNATURE_DATA.length - 1] ).length - CATEGORY.length;

  $(".modal-select .card").hide();

  $(".modal-select .card").each(function(index) {
    if( GRAPH_TYPE[$(this).attr('graph-type')] <= numeric_field_cnt ) 
      $(this).show();
  });
}

function computeCategory() {
  for(var key in SIGNATURE_DATA[SIGNATURE_DATA.length - 1]) {
    if( !isFieldNumeric(key) )
      CATEGORY.push(key);
  }
}

function countLetter(inElement) {
    var postLength = detectBrowser() == 'ie' ? inElement.textContent.length : inElement.textLength;
    var charactersLeft = 140 - postLength;
    inElement.getElementsByClassName("status-box");

    var counter = inElement.parentElement.parentElement.parentElement.getElementsByClassName("counter")[0];
    counter.innerHTML = charactersLeft;

    if (charactersLeft < 0) {
        inElement.parentElement.parentElement.parentElement.getElementsByClassName("comments-post")[0].classList += " disabled";
        counter.classList += " minus-counter";
    } else if (charactersLeft == 140) {
        inElement.parentElement.parentElement.parentElement.getElementsByClassName("comments-post")[0].classList += " disabled";
    } else {
        inElement.parentElement.parentElement.parentElement.getElementsByClassName("comments-post")[0].classList.remove("disabled");
        counter.classList.remove("minus-counter");
    }
}

function getFieldVal(inField, inCondition=function(r){ return true;}) {
  var arr = []
  for(var i = 0; i < SIGNATURE_DATA.length; i++) {
    if( !(inField in SIGNATURE_DATA[i]) ) continue;
    if( !inCondition(SIGNATURE_DATA[i]) ) continue;

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
  $(".graph-options").hide();
  $("#{0}-interface.graph-options".format(inGraphType)).show();

  $("#{0}-interface select".format(inGraphType)).empty();
  $(".value-select-container").empty();

  if (inGraphType == "scatter") {
    for (var key in SIGNATURE_DATA[SIGNATURE_DATA.length - 1]) {
      if ( !CATEGORY.includes(key) ) {
        $("#{0}-interface .x-axis".format(inGraphType)).append( "<option value='{0}'>{1}</option>".format(key, key) );

        $("#{0}-interface .y-axis".format(inGraphType)).append( '<p><label> <input type="checkbox" name="questions-public" value="{0}"> <span>{1}</span> </label></p>'.format(key, key) );
      }
    }
  }

  else if(inGraphType == "pie") {
    for (var key in SIGNATURE_DATA[SIGNATURE_DATA.length - 1]) {
      if ( CATEGORY.includes(key) )
        $("#{0}-interface .x-axis".format(inGraphType)).append( "<option value='{0}'>{1}</option>".format(key, key) );
      else 
        $("#{0}-interface .select-value".format(inGraphType)).append( "<option value='{0}'>{1}</option>".format(key, key) );    
    }
  }

  else {
    var $div = $("<div value={0}></div>".format(CATEGORY[0]));
    $div.append( '<p>{0}</p>'.format(CATEGORY[0]) ); 
    $div.append( '<p><label> <input type="checkbox" name="y-val-select" value="{0}"> <span>{1}</span> </label></p>'.format('count', 'count') );    

    $("#{0}-interface .y-axis".format(inGraphType)).append( $div ); 
    // $("#{0}-interface .y-axis".format(inGraphType)).append( '<p><label> <input type="checkbox" name="y-val-select" value="{0}"> <span>{1}</span> </label></p>'.format('count', 'count') );    

    for (var key in SIGNATURE_DATA[SIGNATURE_DATA.length - 1]) {
      if ( CATEGORY.includes(key) ) {
        $("#{0}-interface .x-axis".format(inGraphType)).append( "<option value='{0}'>{1}</option>".format(key, key) );
      }
      else {
        $div = $("<div class='y-value-wrapper' value='{0}''></div>".format(key));
        $div.append( '<p>{0}</p>'.format(key) ); 

        $.each([ 'min', 'max', 'avg', 'sum' ], function( index, value ) {
          $div.append( '<p><label> <input type="checkbox" name="y-val-select" value="{0}"> <span>{1}</span> </label></p>'.format(value, value) );    
        });    
        
        $("#{0}-interface .y-axis".format(inGraphType)).append( $div );
      }
    }
  }
  
  initialize_materialize_css();
}

// inValueFields : {"count": fieldName, "sum": [..], "min": [..], "max": [..], "aver": [..], "field": [..]}
function drawChart(inGraphType, inField, inValueFields) {
  var chart;
  var data;

  /*([
    ['Task', 'Hours per Day'],
    ['Work',     11],
    ['Eat',      2],
    ['Commute',  2],
    ['Watch TV', 2],
    ['Sleep',    7]
  ]);*/

  if( inGraphType == "pie") {
    var graphData = [];

    // If it's count
    if ( "count" in inValueFields) {
      graphData.push([inField, 'Count for each ' + inField]);

      var arr = getFieldVal(inField);
      var counts = {};

      for (var i = 0; i < arr.length; i++) {
        var val = arr[i];
        counts[val] = counts[val] ? counts[val] + 1 : 1;
      }

      for (var key in counts) {
        graphData.push([key, counts[key]]);
      }
    } else { // sum of other field
      graphData.push([inField, 'Sum of ' + inValueFields['sum'][0]]);

      var category_vals = new Set(getFieldVal(inField));
      var sum = {};

      category_vals.forEach(function(v) {
        sum[v] = SUM( getFieldVal(inValueFields['sum'][0], function(d) { if(d[inField] == v) return true; return false; }).map(x => (parseFloat(x))) );
      });

      for (var key in sum) {
        graphData.push([key, sum[key]]);
      }
    }

    data = google.visualization.arrayToDataTable( graphData );
    chart = new google.visualization.PieChart(document.getElementById('chart-container'));
  } else if( inGraphType == "line" || inGraphType == "area" || inGraphType == "bar") {
    var graphData = [];

    // Construct x-axis
    var category_vals = new Set(getFieldVal(inField));
    category_vals = Array.from(category_vals);
    category_vals.sort();

    graphData.push([inField]);
    for (var i = 0; i < category_vals.length; i++) {
      graphData.push([category_vals[i]]);
    }

    // y-axis
    for(var key in inValueFields) {
      if (key == "count") {
        var arr = getFieldVal(inField);
        var counts = {};

        for (var i = 0; i < arr.length; i++) {
          var val = arr[i];
          counts[val] = counts[val] ? counts[val] + 1 : 1;
        }

        graphData[0].push( "Count of " + inField );
        for (var i = 1; i < graphData.length; i++) {
          graphData[i].push( graphData[i][0] in counts ? counts[graphData[i][0]] : 0 );
        }
      } else {
        var category_vals = new Set(getFieldVal(inField));
        for (var i = 0; i < inValueFields[key].length; i++) {
          
          var arr = {};

          category_vals.forEach(function(v) {
            if( key == "sum")
              arr[v] = SUM( getFieldVal(inValueFields[key][i], function(d) { if(d[inField] == v) return true; return false; }).map(x => (parseFloat(x))) );
            else if( key == "min")
              arr[v] = MIN( getFieldVal(inValueFields[key][i], function(d) { if(d[inField] == v) return true; return false; }).map(x => (parseFloat(x))) );
            else if( key == "max")
              arr[v] = MAX( getFieldVal(inValueFields[key][i], function(d) { if(d[inField] == v) return true; return false; }).map(x => (parseFloat(x))) );
            else if( key == "avg")
              arr[v] = AVER( getFieldVal(inValueFields[key][i], function(d) { if(d[inField] == v) return true; return false; }).map(x => (parseFloat(x))) );
          });

          graphData[0].push( key + " of " + inValueFields[key][i] );
          for (var j = 1; j < graphData.length; j++) {
            graphData[j].push( graphData[j][0] in arr ? arr[graphData[j][0]] : 0 );
          }
        }
      }
    }

    data = google.visualization.arrayToDataTable( graphData );

    if(inGraphType == "line") chart = new google.visualization.LineChart(document.getElementById('chart-container'));
    else if(inGraphType == "area") chart = new google.visualization.AreaChart(document.getElementById('chart-container'));
    else chart = new google.visualization.BarChart(document.getElementById('chart-container'));

  } else if( inGraphType == "scatter" ) {
    var graphData = [[inField]];

    for( var i = 0 ; i < inValueFields.field.length; i++) {
      graphData[0].push( inValueFields.field[i] );
    }

    for( var i = 0; i < SIGNATURE_DATA.length ; i ++) {
      var a = [parseFloat(SIGNATURE_DATA[i][inField])];

      for (var j = 0 ; j < inValueFields.field.length; j++) {
        a.push( parseFloat(SIGNATURE_DATA[i][inValueFields.field[j]]) );
      }
      graphData.push( a );
    }


    data = google.visualization.arrayToDataTable( graphData );

    chart = new google.visualization.ScatterChart(document.getElementById('chart-container'));
  }
  

  var options = {
      // title: graphData[0][1]
  };
  chart.draw(data, options);
}

function getSelectedOption( inGraphType ) {
  var res = {'x': [], 'y':{}};

  res.x.push($("#{0}-interface .x-axis".format(inGraphType))[0].value);

  $("#{0}-interface .y-axis".format(inGraphType))

  $("#{0}-interface .y-axis input:checked".format(inGraphType)).each(function(i) { 
    var v = $(this).attr('value');

    if (v == "count") {
      for (var i = 0; i < res.x.length ; i++) {
        'count' in res['y'] ? res['y']['count'].push(res.x[i]) : res['y'] = {"count": [res.x[i]]};
      }
    } else if ( ["min", "max", "sum", "avg"].includes(v) ) { 
      if( inGraphType == "pie") {
        var s = $($(this).parent()[0]).find('.select-dropdown').get(0).value;
        v in res['y'] ? res['y'][v].push(s) : res['y'][v] = [s];
      }
      else {
        var s = $(this).parents(".y-value-wrapper")[0].getAttribute('value');
        v in res['y'] ? res['y'][v].push(s) : res['y'][v] = [s];
      }
      
    } else {
      if ( inGraphType == "scatter" )
        'field' in res['y'] ? res['y']['field'].push(v) : res['y']['field'] = [v];
    }

  });

  return res;
}

function initialize_materialize_css() {
  console.log('initialize')
  var elems = document.querySelectorAll('select');
  var instances = M.FormSelect.init(elems, {});
}

function addModalClickEventListener(query, func, ...args) {
  var elements = document.querySelectorAll(query);
  for (var i = 0; i < elements.length; i++) {
    elements[i].addEventListener('click', (e) => {
      func(e, args);
    })
  }
}

function getCardFromClickEvent(event) {
  if (event.target.nodeName == 'IMG') {
    return event.target.parentElement.parentElement.parentElement;
  } else if (event.target.nodeName == 'A') {
    return event.target.parentElement.parentElement;
  }
}

function removeHighlightFromCards(className) {
  var elements = document.getElementsByClassName('card');
  for (var i = 0; i < elements.length; i++) {
    $(elements[i]).removeClass(className);
  }
}
