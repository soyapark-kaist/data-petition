var SIGNATURE_DATA = [], 
  FIELDS = {};            // Dict of fields, question ID -> {"title" : [question Title], "is_numeric": boolean}

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
  
  updateSignatureData();

  /* load petition content */ 
  var questionRef = firebase.database().ref("petition/" + params['petition'] + "/contents");
  // petition/[petitionID]

  questionRef.once("value").then(function(snapshot) {
    var contents = snapshot.val();
    setContents(editor, contents);
  });

  showLoader(false);
}

function updateSignatureData() {
  // Remove previous interface
  $(".tabs .tab").remove();
  $("#filter-charts").empty();
  $("#flight-list").empty();

  var params = getJsonFromUrl(true);

  var formLink = "https://docs.google.com/forms/d/" + params['petition'].split("#")[0] + "/edit?usp=sharing";
  // callScriptFunction('getSignatures', [formLink], initSignatureSummary, displayErrorMsg);

  var p = {'func': 'getSignatures', 'pid': params['petition'], 'callback': 'initSignatureSummary'};
  get(p);
}
    
function initSignatureSummary(inRes) {
  console.log(inRes);
  var params = getJsonFromUrl(true);

  // Project only public data
  var questionRef = firebase.database().ref("petition/" + params['petition'] + "/question");
  questionRef.once("value").then(function(snapshot) {
      var questions = snapshot.val();

      var q = {}; // question title -> public boolean
      for(var i =0; i< questions.length; i++) {
        q[questions[i]['title']] = questions[i]['done'];

        if(questions[i]['done']) {
          FIELDS[questions[i]['id']] = {'title': questions[i]['title']};
        }
      } 

      for(var i =0; i< inRes.signature.length; i++) {
        var clone = Object.assign({}, inRes.signature[i]);

        Object.keys( inRes.signature[i] ).forEach(function(key) {
          if( !q[key] )
            delete clone[key];
        });

        SIGNATURE_DATA.push(clone);
        
      }
      
      // SIGNATURE_DATA = inRes.signature;

      if (SIGNATURE_DATA.length > 0) {
        computeCategory();
        initFilter(SIGNATURE_DATA);


      } else {
        $(".card").hide();
        $("#msg-no-available-chart").show();
      }

      prepareVizInterface("line");

      initListener();

      showLoader(false);
  });

  /* Set progress bar. */ 
  // var goalRef = firebase.database().ref("petition/" + params['petition'] + "/goal");
  // // petition/[petitionID]
  // //location_searching
  // goalRef.once("value").then(function(snapshot) {
  //   var goal = parseInt(snapshot.val()) ? parseInt(snapshot.val()) : 100;
  
  //   $("#participants-number").text(SIGNATURE_DATA.length);
  //   $(".progress .determinate").css("width", (SIGNATURE_DATA.length / goal * 100) + "%");
  // });
} 

function detectLocation(inOnSuccess) {
  if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
          center = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
          };  
          console.log(center)

          showLoader(false);
          inOnSuccess(center);
      },
      function() { //error callback
          console.log("Error geolocation");
      }, {
          timeout: 10000
      });
  } else {
      // Browser doesn't support Geolocation
      console.log("Error geolocation; brower doesn't support");
  }
}

function openResponse(inRes) {
  window.open( inRes['preFilledUrl'] );


  $('#form-loader').hide();
  $('.modal').modal('close');
  $("#btn_sign_petition").html('<i class="material-icons green">done</i>');
}

function convertData( inArray ) {
  var s = "";
  for (var i = 0; i < inArray.length; i++) {
    for (var j = 0 ; j < inArray[i].length; j++) {
      s += (inArray[i][j] + (j == inArray[i].length -1?" \n" : " \t"));
    }
  }

  return s;
} 

function formatData( inXFieldName, inYFiledNames, data_array ) {
  var s = inXFieldName + " \t";
  data_array = data_array? data_array: SIGNATURE_DATA;

  for(var i = 0 ;i < inYFiledNames.length; i++) {
    s += (inYFiledNames[i] + (i == inYFiledNames.length -1?" \n" : " \t"));
  }

  for( var i = 0; i < data_array.length; i++ ) {
    var tmp_s = "";
    var emptyVal = false;

    //TODO how to handle empty val
    for(var j = 0 ;j < inYFiledNames.length; j++) {
      if (inYFiledNames[j] in data_array[i])
        tmp_s += (data_array[i][inYFiledNames[j]] + (j == inYFiledNames.length -1?" \n" : " \t"));
      else {
        emptyVal = true;
        break;
      }
    }

    if (!emptyVal && inXFieldName in data_array[i]) {
      s += (data_array[i][inXFieldName] + " \t");
      s += tmp_s;
    }
  }

  return s;
}


/* Triggered when x-axis and y-axis changed */
function prepareDrawChart( inEvent ) {
  var graph_type = inEvent.parents('.graph-options').attr('graph-type');
  graph_type = "line";
  var o = getSelectedOption( graph_type );

  if ( graph_type == "area" || graph_type == "line" || graph_type == "bar") {
    $(".axis-select-container .y-axis div").first().attr( "value", o.x[0] );
    $(".axis-select-container .y-axis p").first().text( o.x[0] );
  }

  updateChartData( formatData(o.x[0], o.y, window.currentData()) );

  drawChart( "line", o.x[0], o.y );
}

function initListener() {
  // Modal init
  var elems = document.querySelectorAll('.modal');
  var instances = M.Modal.init(elems, {
    'onCloseEnd': () => {
      removeHighlightFromCards('orange lighten-4');
    }
  });

  // document.addEventListener('DOMContentLoaded', function() {

  // });

  var params = getJsonFromUrl(true);

  /* Set signature btn. */ 
  // if this petition requires geolocation, send it to prefilled location.
  var geoRef = firebase.database().ref("petition/" + params['petition'] + "/geolocation");
  // petition/[petitionID]

  geoRef.once("value").then(function(snapshot) {
    var geo = snapshot.val();

    if(geo['collect']) {
      // signature submit btn clicked -> geo location detect -> prefilled url generate -> open the url
      
      $("#open_form_btn").on("click", function() {
        $('#form-loader').show();

        var prefillUrl = function(inRes) {
          var params = getJsonFromUrl(true);
          var p = {"func": "getPrefilledUrls", "pid": params['petition'], "qid": geo['id'], "loc": inRes.lat+",+"+inRes.lng, "callback": "openResponse"};
          get(p); 
        }

         detectLocation(prefillUrl);
      })
      
      // if require geo-location show marker next to the button
      $("#icon-location-marker").show();
    }
    
    else {
      $("#icon-location-marker").hide();
      $("#open_form_btn").attr("onclick", "window.open('" + inRes['publishLink'] +"')");
    }
    
  });

  /* Set scaffolder. */ 
  var scaffolderRef = firebase.database().ref("petition/" + params['petition'] + "/scaffolder");
  // petition/[petitionID]

  scaffolderRef.once("value").then(function(snapshot) {
    var s = snapshot.val();

    $("#scaffolder-container").html(s);
  });

  $(document).on('change', 'select.x-axis, .y-axis input, .y-axis select', function() {
    prepareDrawChart( $(this) );
  });

  // Initilize draw charts with first data

  // var o = getSelectedOption( "line" );
  // updateChartData( formatData($("#axis-select-container li span")[1].innerHTML, o.y, window.currentData()) );

  // drawChart( "line", $("#axis-select-container li span")[1].innerHTML, o.y );
}

function computeCategory() {
  for (var key in FIELDS) {
    if( isFieldNumeric(FIELDS[key].title) )
      FIELDS[key]["is_numeric"] = true;
    else 
      FIELDS[key]["is_numeric"] = false;
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
  var arr = [];
  var data_array = window.currentData();

  for(var i = 0; i < data_array.length; i++) {
    if( !(inField in data_array[i]) ) continue;
    if( !inCondition(data_array[i]) ) continue;

    arr.push(data_array[i][inField]);
  }
  
  return arr;
}

function isFieldNumeric(inField) {
  var arr = getFieldVal(inField);

  return !(arr.map(x => (isNaN(x))).includes(true));
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
    for (var key in FIELDS) {
      if(FIELDS[key]["is_numeric"]) {
        $("#{0}-interface .x-axis".format(inGraphType)).append( "<option value='{0}'>{1}</option>".format(key, key) );
        $("#{0}-interface .y-axis".format(inGraphType)).append( '<p><label> <input type="checkbox" name="questions-public" value="{0}"> <span>{1}</span> </label></p>'.format(key, key) );
      }
    }
  }

  else if(inGraphType == "pie") {
    for (var key in FIELDS) {
      if(FIELDS[key]["is_numeric"]) {
        $("#{0}-interface .select-value".format(inGraphType)).append( "<option value='{0}'>{1}</option>".format(key, key) );    
      }
      else {
        $("#{0}-interface .x-axis".format(inGraphType)).append( "<option value='{0}'>{1}</option>".format(key, key) );
      }
    }
  }

  else {
    var col_length_s = 12;
    var col_length_m = 6;

    // Initialize interface with the first x-axis
    var field = '';
    for(var key in FIELDS) {
      if(!FIELDS[key]["is_numeric"]) {
        field = key;
        break;
      }
    }


    // div에 value가...?
    var $div = $("<div class='col s{1} m{2} center' value={0}></div>".format(FIELDS[field]["title"], col_length_s, col_length_m));
    $div.append( '<p>{0}</p>'.format(FIELDS[field]["title"]) ); 
    $div.append( '<p><label> <input type="checkbox" name="y-val-select" value="{0}" checked> <span>{1}</span> </label></p>'.format('count', 'count') );    

    $(".axis-select-container .y-axis".format(inGraphType)).append( $div ); 
    // $("#{0}-interface .y-axis".format(inGraphType)).append( '<p><label> <input type="checkbox" name="y-val-select" value="{0}"> <span>{1}</span> </label></p>'.format('count', 'count') );    

    for(var key in FIELDS) {
      if (FIELDS[key]["is_numeric"]) {
        $div = $("<div class='y-value-wrapper col s{1} m{2} center' value='{0}''></div>".format(FIELDS[key]["title"], col_length_s, col_length_m));
        $div.append( '<p>{0}</p>'.format(FIELDS[key]["title"]) ); 

        $.each([ 'min', 'max', 'avg', 'sum' ], function( index, value ) {
          $div.append( '<p><label> <input type="checkbox" name="y-val-select" value="{0}"> <span>{1}</span> </label></p>'.format(value, value) );    
        });    
        
        $(".axis-select-container .y-axis".format(inGraphType)).append( $div );
      }
      else 
        $(".axis-select-container .x-axis".format(inGraphType)).append( "<option value='{0}'>{1}</option>".format(FIELDS[key]["title"], FIELDS[key]["title"]) );
    }
  }

  // manipulate_form_fillout_configuration();
  manipulate_chart_configuration();
  initialize_materialize_css();
  choose_axis('.x-axis-wrapper', (i) => {
    return i == 0 ? 0 : 2;
  })
}

function updateChartData(inData) {

  if( inData == " \n") return;

  /* filter data */
  document.querySelector(".chartbuilder-main textarea").value = inData

  var event = new CustomEvent("click", { "detail": "Example of an event" });
  var elem = $(".cb-button.button-group-button")[3];

  elem.dispatchEvent(event); 

  $(elem).trigger("click");
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

    // data = google.visualization.arrayToDataTable( graphData );

    // if(inGraphType == "line") chart = new google.visualization.LineChart(document.getElementById('chart-container'));
    // else if(inGraphType == "area") chart = new google.visualization.AreaChart(document.getElementById('chart-container'));
    // else chart = new google.visualization.BarChart(document.getElementById('chart-container'));

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

  updateChartData( convertData(graphData) );
  // chart.draw(data, options);
}

function getSelectedOption( inGraphType ) {
  var res = {'x': [], 'y':{}};

  res.x.push($(".axis-select-container .x-axis")[0].value);


  $(".axis-select-container .y-axis input:checked").each(function(i) { 
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

function manipulate_chart_configuration() {
  var $chartbuilder_editor = $('.chartbuilder-editor');
  //$chartbuilder_editor.before('<div class="center"><a class="chart-editor-btn waves-effect waves-light btn grey">Edit Chart Configuration</a></div>')

  $chartbuilder_editor.hide();
  function edtor_toggle() {
    $chartbuilder_editor.fadeToggle({
        'duration': 300,
    });
    $('#my-modal-wall').fadeToggle({
      'duration': 300,
    });
  }
  $(document).on('click', '.chart-editor-btn', () => {
    edtor_toggle();
  });
  $(document).on('click', '#my-modal-wall', () => {
    edtor_toggle();
  });
}

function choose_axis(x_wrapper_selector, y_options_func) {
  setTimeout(() => {
    choose_x_axis(x_wrapper_selector);
    choose_y_axis(y_options_func);
  }, 500);
}

function choose_x_axis(wrapper_selector) {
  console.log(wrapper_selector, $('{0} ul'.format(wrapper_selector)));
  $('{0} li'.format(wrapper_selector))[1].click();
}

function choose_y_axis(options_func) {
  var $y_axis = $('.y-axis .col');
  for(var i = 0; i < $y_axis.length; i++) {
    var label = $y_axis[i].getElementsByTagName('label');
    $(label[options_func(i)]).click();
  }
}

