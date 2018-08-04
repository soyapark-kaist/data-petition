function detectBrowser() {
    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) return 'safari';
    else if (/Firefox/.test(window.navigator.userAgent)) return 'firefox';
    else if (window.navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) return 'ie';

    return 'unknown';
}

function showLoader(inShow) {
	if(inShow) $(".loading-container").show();
	else $(".loading-container").hide();
}