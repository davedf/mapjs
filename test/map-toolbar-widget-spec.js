/*global beforeEach, describe, expect, it, jQuery, spyOn, MAPJS*/
describe('mapToolbarWidget', function () {
	'use strict';
	var mapModel, element;
	beforeEach(function () {
		mapModel = new MAPJS.MapModel();
		element = jQuery('<div>\
				<input type="button" class="scaleUp" value="+"></input>\
				<input type="button" class="scaleDown" value="-"></input>\
				<input type="button" class="addSubIdea" value="++"></input>\
				<input type="button" class="editNode" value="edit"></input>\
				<input type="button" class="removeSubIdea" value="remove"></input>\
			</div>'
		);
		element.appendTo('body');
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
	it('should invoke addSubIdea on map model when button is clicked', function () {
		spyOn(mapModel, 'addSubIdea');
		element.mapToolbarWidget(mapModel);

		element.find('.addSubIdea').click();

		expect(mapModel.addSubIdea).toHaveBeenCalledWith('toolbar');
	});
	it('should invoke editNode on map model when button is clicked', function () {
		spyOn(mapModel, 'editNode');
		element.mapToolbarWidget(mapModel);

		element.find('.editNode').click();

		expect(mapModel.editNode).toHaveBeenCalledWith('toolbar');
	});
	it('should invoke removeSubIdea on map model when button is clicked', function () {
		spyOn(mapModel, 'removeSubIdea');
		element.mapToolbarWidget(mapModel);

		element.find('.removeSubIdea').click();

		expect(mapModel.removeSubIdea).toHaveBeenCalledWith('toolbar');
	});

});