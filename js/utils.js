function detectBrowser() {
    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) return 'safari';
    else if (/Firefox/.test(window.navigator.userAgent)) return 'firefox';
    else if (window.navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) return 'ie';

    return 'unknown';
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

  for (var key in result) {
  	result[key] = result[key].split("/")[0].split("#")[0];
  }
  return result;
}

function showLoader(inShow) {
	if(inShow) $(".loading-container").show();
	else $(".loading-container").hide();
}


var params = getJsonFromUrl(true);
p = params['petition'].split("/")[0].split("#")[0];
$("#petition-container").attr("mv-app", "petition/" + p);
