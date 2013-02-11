/*jslint nomen: true*/
/*global _*/
var MAPJS = MAPJS || {};
MAPJS.freemindFormat = function (idea) {
	'use strict';
	var formatNode = function (idea) {
		return '<node ID="' +
			idea.id +
			'" TEXT="' +
			idea.title.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '">' +
			(_.size(idea.ideas) > 0 ? _.map(_.sortBy(idea.ideas, function (val, key) { return parseFloat(key); }), formatNode).join('') : '') +
			'</node>';
	};
	return '<map version="0.7.1">' + formatNode(idea) + '</map>';
};
