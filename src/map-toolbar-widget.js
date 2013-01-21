/*global jQuery*/
jQuery.fn.mapToolbarWidget = function (mapModel) {
	'use strict';
	this.each(function () {
		var element = jQuery(this);
		['scaleUp', 'scaleDown', 'addSubIdea', 'editNode', 'removeSubIdea'].forEach(function (methodName) {
			element.find('.' + methodName).click(function () {
				if (mapModel[methodName]) {
					mapModel[methodName]('toolbar');
				}
			});
		});

	});
	return this;
};