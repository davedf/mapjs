/*global jQuery*/
/*jslint es5: true*/
jQuery.fn.mapToolbarWidget = function (mapModel) {
	'use strict';
	var methodNames = ['insertIntermediate', 'scaleUp', 'scaleDown', 'addSubIdea', 'editNode', 'removeSubIdea', 'toggleCollapse'];
	return this.each(function () {
		var element = jQuery(this);
		methodNames.forEach(function (methodName) {
			element.find('.' + methodName).click(function () {
				if (mapModel[methodName]) {
					mapModel[methodName]('toolbar');
				}
			});
		});
	});
};
