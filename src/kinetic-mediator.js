/*global _, window, document, jQuery, Kinetic*/
var MAPJS = MAPJS || {};
if (Kinetic.Stage.prototype.isRectVisible) {
	throw ('isRectVisible already exists, should not mix in our methods');
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

MAPJS.KineticMediator = function (mapModel, stage, imageRendering) {
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
		resetStage = function () {
			stage.transitionTo({
				x: 0.5 * stage.getWidth(),
				y: 0.5 * stage.getHeight(),
				scale: {
					x: 1,
					y: 1
				},
				duration: 0.5,
				easing: 'ease-in-out',
				callback: function () {
					stage.fire(':scaleChangeComplete');
				}
			});
		};
	stage.add(layer);

	mapModel.addEventListener('nodeEditRequested', function (nodeId, shouldSelectAll) {
		var node = nodeByIdeaId[nodeId];
		if (node) {
			node.editNode(shouldSelectAll);
		}
	});
	mapModel.addEventListener('nodeCreated', function (n) {
		var node = new Kinetic.Idea({
			level: n.level,
			x: n.x,
			y: n.y,
			text: n.title,
			mmStyle: n.style,
			opacity: 1
		}),
			getScale = function () {
				return (stage && stage.attrs && stage.attrs.scale && stage.attrs.scale.x) || 1;
			};

		if (imageRendering) {
			node = Kinetic.IdeaProxy(node, stage, layer);
		}
		/* in kinetic 4.3 cannot use click because click if fired on dragend */
		node.on('click tap', mapModel.selectNode.bind(mapModel, n.id));
		node.on('dblclick dbltap', mapModel.editNode.bind(mapModel, 'mouse', false));
		node.on('dragstart', function () {
			var scale = getScale();

			node.moveToTop();
			node.getNodeAttrs().shadow.offset = {
				x: 8 * scale,
				y: 8 * scale
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
			var scale = getScale();
			node.getNodeAttrs().shadow.offset = {
				x: 4 * scale,
				y: 4 * scale
			};
			mapModel.nodeDragEnd(
				n.id,
				node.attrs.x,
				node.attrs.y
			);
			if (n.level > 1) {
				stage.setDraggable(true);
			}
		});
		node.on(':textChanged', function (event) {
			mapModel.updateTitle(n.id, event.text);
			mapModel.setInputEnabled(true);
		});
		node.on(':editing', function () {
			mapModel.setInputEnabled(false);
		});


		if (n.level > 1) {
			node.on('mouseover touchstart', stage.setDraggable.bind(stage, false));
			node.on('mouseout touchend', stage.setDraggable.bind(stage, true));

		}
		layer.add(node);
		node.transitionToAndDontStopCurrentTransitions({
			opacity: 1,
			duration: 0.4
		});
		console.log(':scaleChangeComplete setup', stage);
		stage.on(':scaleChangeComplete', function () {
			console.log(':scaleChangeComplete');
			node.setupShadows();
		});


		nodeByIdeaId[n.id] = node;

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
		node.off('click dblclick tap dragstart dragmove dragend mouseover mouseout :textChanged');
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
	mapModel.addEventListener('mapScaleChanged', function (scaleMultiplier, zoomPoint) {
		var currentScale = stage.getScale().x || 1,
			targetScale = Math.max(Math.min(currentScale * scaleMultiplier, 5), 0.2);
		if (currentScale === targetScale) {
			return;
		}
		zoomPoint = zoomPoint || {x:  0.5 * stage.getWidth(), y: 0.5 * stage.getHeight()};
		stage.transitionTo({
			scale: {
				x: targetScale,
				y: targetScale
			},
			x: zoomPoint.x + (stage.attrs.x - zoomPoint.x) * targetScale / currentScale,
			y: zoomPoint.y + (stage.attrs.y - zoomPoint.y) * targetScale / currentScale,
			duration: 0.1,
			easing: 'ease-in-out',
			callback: function () {
				stage.fire(':scaleChangeComplete');
			}
		});
	});
	mapModel.addEventListener('mapViewResetRequested', function () {
		resetStage();
	});
	mapModel.addEventListener('mapMoveRequested', function (deltaX, deltaY) {
		moveStage(deltaX, deltaY);
	});
	(function () {
		var x, y;
		stage.on('dragmove', function () {
			var deltaX = x - stage.attrs.x,
				deltaY = y - stage.attrs.y,
				visibleAfterMove = atLeastOneVisible(nodeByIdeaId, 0, 0) || atLeastOneVisible(connectorByFromIdeaId_ToIdeaId, 0, 0),
				shouldMoveBack = !visibleAfterMove && !(atLeastOneVisible(nodeByIdeaId, deltaX, deltaY) || atLeastOneVisible(connectorByFromIdeaId_ToIdeaId, deltaX, deltaY));
			if (shouldMoveBack) {
				moveStage(deltaX, deltaY);
			} else {
				x = stage.attrs.x;
				y = stage.attrs.y;
			}
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
