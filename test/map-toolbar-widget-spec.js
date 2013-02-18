/*global beforeEach, describe, expect, it, jQuery, observable, spyOn, MAPJS*/
/*jslint es5: true*/
describe('mapToolbarWidget', function () {
	'use strict';
	var mapModel, element;
	beforeEach(function () {
		mapModel = new MAPJS.MapModel(observable({}));
		element = jQuery(
			'<div>\
			<input type="button" class="scaleUp" value="+"></input>\
			<input type="button" class="scaleDown" value="-"></input>\
			<input type="button" class="addSubIdea" value="++"></input>\
			<input type="button" class="editNode" value="edit"></input>\
			<input type="button" class="removeSubIdea" value="remove"></input>\
			<input type="button" class="insertIntermediate" value="insert parent"></input>\
			<input type="button" class="addSiblingIdea" value="insert parent"></input>\
			<input data-mm-target-property="color" type="text" class="updateStyle" value=""></input>\
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
	it('should invoke insertIntermediate on map model when button is clicked', function () {
		spyOn(mapModel, 'insertIntermediate');
		element.mapToolbarWidget(mapModel);

		element.find('.insertIntermediate').click();

		expect(mapModel.insertIntermediate).toHaveBeenCalledWith('toolbar');
	});
	it('should invoke addSiblingIdea on map model when button is clicked', function () {
		spyOn(mapModel, 'addSiblingIdea');
		element.mapToolbarWidget(mapModel);

		element.find('.addSiblingIdea').click();

		expect(mapModel.addSiblingIdea).toHaveBeenCalledWith('toolbar');
	});
	it('should invoke updateStyle on map model when value changes', function () {
		spyOn(mapModel, 'updateStyle');
		element.mapToolbarWidget(mapModel);
		element.find('.updateStyle').val('yellow');
		element.find('.updateStyle').change();
		expect(mapModel.updateStyle).toHaveBeenCalledWith('toolbar', 'color', 'yellow');
	});
	it('updates mm-target-property values on selection change', function () {
		var input = element.find('.updateStyle');
		element.mapToolbarWidget(mapModel);
		mapModel.getSelectedStyle = function (v) { if (v === 'color') { return 'x'; } };
		mapModel.dispatchEvent('nodeSelectionChanged');
		expect(input.val()).toBe('x');
	});
});
