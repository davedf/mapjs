/*global jQuery, Kinetic, MAPJS, window, document*/
jQuery.fn.mapWidget = function (activityLog, mapModel, touchEnabled, imageRendering) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this),
			stage = new Kinetic.Stage({
				container: 'container',
				draggable: true
			}),
			mediator = new MAPJS.KineticMediator(mapModel, stage, imageRendering),
			setStageDimensions = function () {
				stage.setWidth(element.width());
				stage.setHeight(element.height());
				stage.draw();
			},
			simulateTouch = function (touchType, hammerEvent) {
				var center;
				if (!hammerEvent.gesture) {
					return; // not a hammer event, instead simulated doubleclick
				}
				center = hammerEvent.gesture.center;
				stage.simulate(touchType, {
					offsetX: center.pageX - element.offset().left,
					offsetY: center.pageY - element.offset().top
				});
			},
			lastGesture,
			discrete = function (gesture) {
				var result = (lastGesture && lastGesture.type !== gesture.type && (gesture.timeStamp - lastGesture.timeStamp < 250));
				lastGesture = gesture;
				return !result;
			},
			keyboardEventHandlers = {
				13: mapModel.addSiblingIdea.bind(mapModel, 'keyboard'),
				8: mapModel.removeSubIdea.bind(mapModel, 'keyboard'),
				9: mapModel.addSubIdea.bind(mapModel, 'keyboard'),
				37: mapModel.selectNodeLeft.bind(mapModel, 'keyboard'),
				38: mapModel.selectNodeUp.bind(mapModel, 'keyboard'),
				39: mapModel.selectNodeRight.bind(mapModel, 'keyboard'),
				40: mapModel.selectNodeDown.bind(mapModel, 'keyboard'),
				46: mapModel.removeSubIdea.bind(mapModel, 'keyboard'),
				32: mapModel.editNode.bind(mapModel, 'keyboard'),
				191: mapModel.toggleCollapse.bind(mapModel, 'keyboard'),
				67: mapModel.cut.bind(mapModel, 'keyboard'),
				80: mapModel.paste.bind(mapModel, 'keyboard'),
				89: mapModel.copy.bind(mapModel, 'keyboard'),
				85: mapModel.undo.bind(mapModel, 'keyboard')
			},
			shiftKeyboardEventHandlers = {
				9: mapModel.insertIntermediate.bind(mapModel, 'keyboard'),
				38: mapModel.toggleCollapse.bind(mapModel, 'keyboard')
			},
			metaKeyboardEventHandlers = {
				48: mapModel.resetView.bind(mapModel, 'keyboard'),
				90: mapModel.undo.bind(mapModel, 'keyboard'),
				89: mapModel.redo.bind(mapModel, 'keyboard'),
				187: mapModel.scaleUp.bind(mapModel, 'keyboard'),
				189: mapModel.scaleDown.bind(mapModel, 'keyboard'),
				38: mapModel.moveRelative.bind(mapModel, 'keyboard', -1),
				40: mapModel.moveRelative.bind(mapModel, 'keyboard', 1),
				88: mapModel.cut.bind(mapModel, 'keyboard'),
				67: mapModel.copy.bind(mapModel, 'keyboard'),
				86: mapModel.paste.bind(mapModel, 'keyboard')
			},
			onKeydown = function (evt) {
				var eventHandler = ((evt.metaKey || evt.ctrlKey) ? metaKeyboardEventHandlers :
						(evt.shiftKey ? shiftKeyboardEventHandlers : keyboardEventHandlers))[evt.which];
				if (/input|textarea|select/i.test(evt.target.nodeName)) {
					return;
				}
				if (eventHandler) {
					eventHandler();
					evt.preventDefault();
				}
			},
			onScroll = function (event, delta, deltaX, deltaY) {
				mapModel.move('mousewheel', -1 * deltaX, deltaY);
				if (event.preventDefault) { // stop the back button
					event.preventDefault();
				}
			};
		mapModel.addEventListener('inputEnabledChanged', function (canInput) {
			stage.setDraggable(!canInput);
		});
		jQuery(document).keydown(onKeydown);
		activityLog.log('Creating canvas Size ' + element.width() + ' ' + element.height());
		setStageDimensions();
		stage.attrs.x = 0.5 * stage.getWidth();
		stage.attrs.y = 0.5 * stage.getHeight();
		jQuery(window).resize(setStageDimensions);
		jQuery('.modal')
			.on('show', mapModel.setInputEnabled.bind(mapModel, false))
			.on('hidden', mapModel.setInputEnabled.bind(mapModel, true));
		if (!touchEnabled) {
			jQuery(window).mousewheel(onScroll);
		} else {
			element.find('canvas').hammer().on("pinch", function (event) {
				if (discrete(event)) {
					mapModel.scale('touch', event.gesture.scale, {
						x: event.gesture.center.pageX - element.offset().left,
						y: event.gesture.center.pageY - element.offset().top
					});
				}
			}).on("swipe", function (event) {
				if (discrete(event)) {
					mapModel.move('touch', event.gesture.deltaX, event.gesture.deltaY);
				}
			}).on("doubletap", function (event) {
				mapModel.resetView();
			}).on("touch", function (evt) {
				jQuery('.topbar-color-picker:visible').hide();
				jQuery('.ideaInput:visible').blur();
			});
		}
	});
};
