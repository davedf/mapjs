/*global jQuery*/
jQuery.fn.mapToolbarWidget = function (mapModel) {
	'use strict';
	this.each(function () {
		var element = jQuery(this);
		element.find('.scaleUp').click(function () {
			mapModel.scaleUp('toolbar');
		});
		element.find('.scaleDown').click(function () {
			mapModel.scaleDown('toolbar');
		});
	});
	return this;
};