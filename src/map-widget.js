/*global _, jQuery, Kinetic, MAPJS, window, document*/
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
				'return': mapModel.addSiblingIdea.bind(mapModel, 'keyboard'),
				'del backspace': mapModel.removeSubIdea.bind(mapModel, 'keyboard'),
				'tab': mapModel.addSubIdea.bind(mapModel, 'keyboard'),
				'left': mapModel.selectNodeLeft.bind(mapModel, 'keyboard'),
				'up': mapModel.selectNodeUp.bind(mapModel, 'keyboard'),
				'right': mapModel.selectNodeRight.bind(mapModel, 'keyboard'),
				'down': mapModel.selectNodeDown.bind(mapModel, 'keyboard'),
				'space': mapModel.editNode.bind(mapModel, 'keyboard'),
				'/ shift+up': mapModel.toggleCollapse.bind(mapModel, 'keyboard'),
				'c meta+x ctrl+x': mapModel.cut.bind(mapModel, 'keyboard'),
				'p meta+v ctrl+v': mapModel.paste.bind(mapModel, 'keyboard'),
				'y meta+c ctrl+c': mapModel.copy.bind(mapModel, 'keyboard'),
				'u meta+z ctrl+z': mapModel.undo.bind(mapModel, 'keyboard'),
				'shift+tab': mapModel.insertIntermediate.bind(mapModel, 'keyboard'),
				'meta+0 ctrl+0': mapModel.resetView.bind(mapModel, 'keyboard'),
				'r meta+shift+z meta+y ctrl+y': mapModel.redo.bind(mapModel, 'keyboard'),
				'meta+plus ctrl+plus': mapModel.scaleUp.bind(mapModel, 'keyboard'),
				'meta+minus ctrl+minus': mapModel.scaleDown.bind(mapModel, 'keyboard'),
				'meta+up ctrl+up': mapModel.moveRelative.bind(mapModel, 'keyboard', -1),
				'meta+down ctrl+down': mapModel.moveRelative.bind(mapModel, 'keyboard', 1),
				'ctrl+shift+v meta+shift+v': mapModel.pasteStyle.bind(mapModel, 'keyboard')
			},
			onScroll = function (event, delta, deltaX, deltaY) {
				mapModel.move('mousewheel', -1 * deltaX, deltaY);
				if (event.preventDefault) { // stop the back button
					event.preventDefault();
				}
			};
		jQuery.hotkeys.specialKeys[187] = 'plus';
		jQuery.hotkeys.specialKeys[189] = 'minus';
		_.each(keyboardEventHandlers, function (mappedFunction, keysPressed) {
			jQuery(document).keydown(keysPressed, function (event) {
				event.preventDefault();
				mappedFunction();
			});
		});
		mapModel.addEventListener('inputEnabledChanged', function (canInput) {
			stage.setDraggable(!canInput);
		});
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
