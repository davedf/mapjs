/*global beforeEach, describe, expect, it, jQuery, spyOn, MAPJS*/
describe('mapToolbarWidget', function () {
	'use strict';
	var mapModel, element;
	beforeEach(function () {
		mapModel = new MAPJS.MapModel();
		element = jQuery('.mapToolbarWidget');
	});
	it('should be used as a jquery plugin', function () {
		var result;

		result = element.mapToolbarWidget(mapModel);

		expect(result).toBe(element);
	});
	it('should invoke scaleUp method on map model when + button is clicked', function () {
		spyOn(mapModel, 'scaleUp');
		element.mapToolbarWidget(mapModel);

		element.find('.scaleUp').click();

		expect(mapModel.scaleUp).toHaveBeenCalledWith('toolbar');
	});
	it('should invoke scaleDown method on map model when - button is clicked', function () {
		spyOn(mapModel, 'scaleDown');
		element.mapToolbarWidget(mapModel);

		element.find('.scaleDown').click();

		expect(mapModel.scaleDown).toHaveBeenCalledWith('toolbar');
	});
});