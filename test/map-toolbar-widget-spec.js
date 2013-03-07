/*global _, jasmine,beforeEach, describe, expect, it, jQuery, observable, spyOn, MAPJS, content*/
/*jslint es5: true*/
describe('mapToolbarWidget', function () {
	'use strict';
	var mapModel, element;
	beforeEach(function () {
		mapModel = new MAPJS.MapModel(observable({}), function () { return []; });
		element = jQuery(
			'<div>\
			<input type="button" class="scaleUp" value="+"></input>\
			<input type="button" class="scaleDown" value="-"></input>\
			<input type="button" class="addSubIdea" value="++"></input>\
			<input type="button" class="editNode" value="edit"></input>\
			<input type="button" class="removeSubIdea" value="remove"></input>\
			<input type="button" class="insertIntermediate" value="insert parent"></input>\
			<input type="button" class="addSiblingIdea" value="insert parent"></input>\
			<input type="button" class="undo" value="undo"></input>\
			<input type="button" class="redo" value="redo"></input>\
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
	it('should invoke underlying method on map model when button is clicked', function () {
		var methods = ['scaleUp', 'scaleDown', 'removeSubIdea', 'editNode', 'addSubIdea', 'insertIntermediate', 'addSiblingIdea', 'undo', 'redo'];
		_.each(methods, function (method) {
			spyOn(mapModel, method);
			element.mapToolbarWidget(mapModel);
			element.find('.' + method).click();
			expect(mapModel[method]).toHaveBeenCalledWith('toolbar');
		});
	});

	it('should invoke updateStyle on map model when value changes', function () {
		spyOn(mapModel, 'updateStyle');
		element.mapToolbarWidget(mapModel);
		element.find('.updateStyle').val('yellow');
		element.find('.updateStyle').change();
		expect(mapModel.updateStyle).toHaveBeenCalledWith('toolbar', 'color', 'yellow');
	});
	it('updates mm-target-property values on selection change', function () {
		var input = element.find('.updateStyle'),
			spy = jasmine.createSpy('changed');
		element.mapToolbarWidget(mapModel);
		input.change(spy);
		mapModel.getSelectedStyle = function (v) { if (v === 'color') { return 'x'; } };
		mapModel.setIdea(content({}));
		mapModel.dispatchEvent('nodeSelectionChanged');
		expect(input.val()).toBe('x');
		expect(spy).toHaveBeenCalled();
	});
});
