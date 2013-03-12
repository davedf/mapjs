/*global _, window, document, jQuery, Kinetic*/
var MAPJS = MAPJS || {};
if (Kinetic.Stage.prototype.isRectVisible) {
	throw ("isRectVisible already exists, should not mix in our methods");
}
MAPJS.Rectangle = function (x, y, width, height) {
	'use strict';
	this.scale = function (scale) {
		return new MAPJS.Rectangle(x * scale, y * scale, width * scale, height * scale);
	};
	this.translate = function (dx, dy) {
		return new MAPJS.Rectangle(x + dx, y + dy, width, height);
	};
	this.inset = function (margin) {
		return new MAPJS.Rectangle(x + margin, y + margin, width - (margin * 2), height - (margin * 2));
	};
	this.x = x;
	this.y = y;
	this.height = height;
	this.width = width;
};
Kinetic.Stage.prototype.isRectVisible = function (rect, offset) {
	'use strict';
	offset = offset || {x: 0, y: 0, margin: 0};
	var scale = this.getScale().x || 1;
	rect = rect.scale(scale).translate(offset.x, offset.y).inset(offset.margin);
	return !(
		rect.x + this.attrs.x > this.getWidth() ||
		rect.x + rect.width + this.attrs.x < 0  ||
		rect.y + this.attrs.y > this.getHeight() ||
		rect.y + rect.height + this.attrs.y < 0
	);
};

MAPJS.KineticMediator = function (mapModel, stage) {
	'use strict';
	var layer = new Kinetic.Layer(),
		nodeByIdeaId = {},
		connectorByFromIdeaId_ToIdeaId = {},
		connectorKey = function (fromIdeaId, toIdeaId) {
			return fromIdeaId + '_' + toIdeaId;
		},
		atLeastOneVisible = function (list, deltaX, deltaY) {
			var margin = Math.min(stage.getHeight(), stage.getWidth()) * 0.1;
			return _.find(list, function (node) {
				return node.isVisible({x: deltaX, y: deltaY, margin: margin});
			});
		},
		moveStage = function (deltaX, deltaY) {
			var visibleAfterMove, visibleBeforeMove;
			if (!stage) {
				return;
			}
			visibleBeforeMove = atLeastOneVisible(nodeByIdeaId, 0, 0) || atLeastOneVisible(connectorByFromIdeaId_ToIdeaId, 0, 0);
			visibleAfterMove = atLeastOneVisible(nodeByIdeaId, deltaX, deltaY) || atLeastOneVisible(connectorByFromIdeaId_ToIdeaId, deltaX, deltaY);
			if (visibleAfterMove || (!visibleBeforeMove)) {
				if (deltaY !== 0) { stage.attrs.y += deltaY; }
				if (deltaX !== 0) { stage.attrs.x += deltaX; }
				stage.draw();
			}
		},
		getTargetShape = function (evt) {
			var is;
			if (evt.offsetX && evt.offsetY) {
				is = stage.getIntersection({x: evt.offsetX, y: evt.offsetY});
				return is && is.shape;
			}
			return false;
		},
		resetStage = function (evt) {
			stage.transitionTo({
				x: 0.5 * stage.getWidth(),
				y: 0.5 * stage.getHeight(),
				scale: {
					x: 1,
					y: 1
				},
				duration: 0.5,
				easing: 'ease-in-out'
			});
		};
	stage.add(layer);
	jQuery(stage.getContainer()).on('dblclick', function (evt) { stage.simulate('dblclick', evt); });
	stage.on('dbltap dblclick', function (evt) {
		if (!getTargetShape(evt)) {
			resetStage();
		}
	});
	mapModel.addEventListener('nodeCreated', function (n) {
		var node = new Kinetic.Idea({
			level: n.level,
			x: n.x,
			y: n.y,
			text: n.title,
			mmStyle: n.style,
			opacity: 0
		});
		/* in kinetic 4.3 cannot use click because click if fired on dragend */
		node.on('click tap', mapModel.selectNode.bind(mapModel, n.id));
		node.on('dragstart', function () {
			node.moveToTop();
			node.attrs.shadow.offset = {
				x: 8,
				y: 8
			};
		});
		node.on('dragmove', function () {
			mapModel.nodeDragMove(
				n.id,
				node.attrs.x,
				node.attrs.y
			);
		});
		node.on('dragend', function () {
			node.attrs.shadow.offset = {
				x: 4,
				y: 4
			};
			mapModel.nodeDragEnd(
				n.id,
				node.attrs.x,
				node.attrs.y
			);
		});
		node.on(':textChanged', function (event) {
			mapModel.updateTitle(n.id, event.text);
			mapModel.dispatchEvent('inputEnabledChanged', true);
		});
		node.on(':editing', function (event) {
			mapModel.dispatchEvent('inputEnabledChanged', false);
		});
		node.on(':nodeEditRequested', mapModel.editNode.bind(mapModel, 'mouse', false));

		mapModel.addEventListener('nodeEditRequested:' + n.id, node.editNode);
		nodeByIdeaId[n.id] = node;
		layer.add(node);
		node.transitionToAndDontStopCurrentTransitions({
			opacity: 1,
			duration: 0.4
		});
	});
	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
		var node = nodeByIdeaId[ideaId],
			scale = stage.getScale().x || 1,
			offset = 100,
			move = { x: 0, y: 0 };
		node.setIsSelected(isSelected);
		if (!isSelected) {
			return;
		}
		if (node.getAbsolutePosition().x + node.getWidth() * scale + offset > stage.getWidth()) {
			move.x = stage.getWidth() - (node.getAbsolutePosition().x + node.getWidth() * scale + offset);
		} else if (node.getAbsolutePosition().x < offset) {
			move.x  = offset - node.getAbsolutePosition().x;
		}
		if (node.getAbsolutePosition().y + node.getHeight() * scale + offset > stage.getHeight()) {
			move.y = stage.getHeight() - (node.getAbsolutePosition().y + node.getHeight() * scale + offset);
		} else if (node.getAbsolutePosition().y < offset) {
			move.y = offset - node.getAbsolutePosition().y;
		}
		stage.transitionTo({
			x: stage.attrs.x + move.x,
			y: stage.attrs.y + move.y,
			duration: 0.4,
			easing: 'ease-in-out'
		});
	});
	mapModel.addEventListener('nodeStyleChanged', function (n) {
		var node = nodeByIdeaId[n.id];
		node.setMMStyle(n.style);
	});
	mapModel.addEventListener('nodeDroppableChanged', function (ideaId, isDroppable) {
		var node = nodeByIdeaId[ideaId];
		node.setIsDroppable(isDroppable);
	});
	mapModel.addEventListener('nodeRemoved', function (n) {
		var node = nodeByIdeaId[n.id];
		delete nodeByIdeaId[n.id];
		node.transitionTo({
			opacity: 0.25,
			duration: 0.4,
			callback: node.remove.bind(node)
		});
		node.off('click dblclick tap dragstart dragmove dragend mouseover mouseout :textChanged :nodeEditRequested');
		mapModel.removeEventListener('nodeEditRequested:' + n.id, node.editNode);
	});
	mapModel.addEventListener('nodeMoved', function (n, reason) {
		var node = nodeByIdeaId[n.id];
		node.transitionTo({
			x: n.x,
			y: n.y,
			duration: 0.4,
			easing: reason === 'failed' ? 'bounce-ease-out' : 'ease-in-out'
		});
	});
	mapModel.addEventListener('nodeTitleChanged', function (n) {
		var node = nodeByIdeaId[n.id];
		node.setText(n.title);
		layer.draw();
	});
	mapModel.addEventListener('connectorCreated', function (n) {
		var connector = new Kinetic.Connector({
			shapeFrom: nodeByIdeaId[n.from],
			shapeTo: nodeByIdeaId[n.to],
			stroke: '#888',
			strokeWidth: 1,
			opacity: 0
		});
		connector.opacity = 0;
		connectorByFromIdeaId_ToIdeaId[connectorKey(n.from, n.to)] = connector;
		layer.add(connector);
		connector.moveToBottom();
		connector.transitionTo({
			opacity: 1,
			duration: 0.4
		});
	});
	mapModel.addEventListener('connectorRemoved', function (n) {
		var key = connectorKey(n.from, n.to),
			connector = connectorByFromIdeaId_ToIdeaId[key];
		delete connectorByFromIdeaId_ToIdeaId[key];
		connector.transitionTo({
			opacity: 0,
			duration: 0.1,
			callback: connector.remove.bind(connector)
		});
	});
	mapModel.addEventListener('mapScaleChanged', function (scaleMultiplier) {
		var scale = Math.max(Math.min((stage.getScale().x || 1) * scaleMultiplier, 5), 0.2);
		stage.transitionTo({
			scale: {
				x: scale,
				y: scale
			},
			duration: 0.1
		});
	});
	mapModel.addEventListener('mapMoveRequested', function (deltaX, deltaY) {
		moveStage(deltaX, deltaY);
	});

	(function () {
		var keyboardEventHandlers = {
			13: mapModel.addSiblingIdea.bind(mapModel, 'keyboard'),
			8: mapModel.removeSubIdea.bind(mapModel, 'keyboard'),
			9: mapModel.addSubIdea.bind(mapModel, 'keyboard'),
			37: mapModel.selectNodeLeft.bind(mapModel, 'keyboard'),
			38: mapModel.selectNodeUp.bind(mapModel, 'keyboard'),
			39: mapModel.selectNodeRight.bind(mapModel, 'keyboard'),
			40: mapModel.selectNodeDown.bind(mapModel, 'keyboard'),
			46: mapModel.removeSubIdea.bind(mapModel, 'keyboard'),
			32: mapModel.editNode.bind(mapModel, 'keyboard'),
			191: mapModel.toggleCollapse.bind(mapModel, 'keyboard')
		}, shiftKeyboardEventHandlers = {
			9: mapModel.insertIntermediate.bind(mapModel, 'keyboard'),
			38: mapModel.toggleCollapse.bind(mapModel, 'keyboard'),
		}, metaKeyboardEventHandlers = {
			48: resetStage,
			90: mapModel.undo.bind(mapModel, 'keyboard'),
			89: mapModel.redo.bind(mapModel, 'keyboard'),
			187: mapModel.scaleUp.bind(mapModel, 'keyboard'),
			189: mapModel.scaleDown.bind(mapModel, 'keyboard')
		},
			onKeydown = function (evt) {
				var eventHandler = ((evt.metaKey || evt.ctrlKey) ? metaKeyboardEventHandlers :
						(evt.shiftKey ? shiftKeyboardEventHandlers : keyboardEventHandlers))[evt.which];
				if (eventHandler) {
					eventHandler();
					evt.preventDefault();
				}
			},
			onScroll = function (event, delta, deltaX, deltaY) {
				moveStage(-1 * deltaX, deltaY);
				if (event.preventDefault) { /* stop the back button */
					event.preventDefault();
				}
			};
		jQuery(document).keydown(onKeydown);
		jQuery(window).mousewheel(onScroll);
		mapModel.addEventListener('inputEnabledChanged', function (isInputEnabled) {
			jQuery(document)[isInputEnabled ? 'bind' : 'unbind']('keydown', onKeydown);
			jQuery(window)[isInputEnabled ? 'mousewheel' : 'unmousewheel'](onScroll);
		});

	}());
};
MAPJS.KineticMediator.dimensionProvider = _.memoize(function (title) {
	'use strict';
	var text = new Kinetic.Idea({
		text: title
	});
	return {
		width: text.getWidth(),
		height: text.getHeight()
	};
});
MAPJS.KineticMediator.layoutCalculator = function (idea) {
	'use strict';
	return MAPJS.calculateLayout(idea, MAPJS.KineticMediator.dimensionProvider);
};
