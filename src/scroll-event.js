/*global document, jQuery,MM,observable,window,navigator */
var MAPJS = MAPJS || {};
MAPJS.ScrollEvent = observable({});

jQuery(function () {
	'use strict';
	/* shamelessly stolen from http://www.javascriptkit.com/javatutors/onmousewheel.shtml */
	function displaywheel(e) {
        var evt = window.event || e, //equalize event object
			delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta; //check for detail first so Opera uses that instead of wheelDelta
        MAPJS.ScrollEvent.dispatchEvent('moved', delta);
    }
    var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel"; //FF doesn't recognize mousewheel as of FF3.x
    if (document.attachEvent) {//if IE (and Opera depending on user setting)
		document.attachEvent("on" + mousewheelevt, displaywheel);
	} else if (document.addEventListener) { //WC3 browsers
		document.addEventListener(mousewheelevt, displaywheel, false);
	}
});
