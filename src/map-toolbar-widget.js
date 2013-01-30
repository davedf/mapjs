/*global jQuery*/
/*jslint es5: true*/
jQuery.fn.mapToolbarWidget = function (mapModel) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this);
		['insertIntermediate','scaleUp', 'scaleDown', 'addSubIdea', 'editNode', 'removeSubIdea'].forEach(function (methodName) {
			element.find('.' + methodName).click(function () {
				if (mapModel[methodName]) {
					mapModel[methodName]('toolbar');
				}
			});
		});
	});
};
