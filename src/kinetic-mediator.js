/*global console, document, jQuery, Kinetic*/
var MAPJS = MAPJS || {};
MAPJS.KineticMediator = function (mapModel, stage) {
	'use strict';
	var layer = new Kinetic.Layer(),
		nodeByIdeaId = {},
		connectorByFromIdeaId_ToIdeaId = {},
		connectorKey = function (fromIdeaId, toIdeaId) {
			return fromIdeaId + '_' + toIdeaId;
		};
	stage.add(layer);
	mapModel.addEventListener('nodeCreated', function (n) {
		var node = new Kinetic.Idea({
			level: n.level,
			x: n.x,
			y: n.y,
			text: n.title,
			opacity: 0
		});
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
			mapModel.updateTitle(event.text);
		});
		node.on(':nodeEditRequested', mapModel.editNode);
		mapModel.addEventListener('nodeEditRequested:' + n.id, node.editNode);
		nodeByIdeaId[n.id] = node;
		layer.add(node);
		node.transitionToAndDontStopCurrentTransitions({
			opacity: 1,
			duration: 0.4
		});
	});
	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
		var node = nodeByIdeaId[ideaId];
		node.setIsSelected(isSelected);
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
			easing: (reason === 'failed' ? 'bounce-ease-out' : 'ease-in-out')
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
	(function () {
		var keyboardEventHandlers = {
			13: mapModel.addSubIdea.bind(mapModel),
			8: mapModel.removeSubIdea.bind(mapModel),
			37: mapModel.selectNodeLeft.bind(mapModel),
			38: mapModel.selectNodeUp.bind(mapModel),
			39: mapModel.selectNodeRight.bind(mapModel),
			40: mapModel.selectNodeDown.bind(mapModel)
		};
		jQuery(document).keydown(function (evt) {
			var eventHandler = keyboardEventHandlers[evt.which];
			if (eventHandler) {
				eventHandler();
				evt.preventDefault();
			}
		});
	}());
};
MAPJS.KineticMediator.dimensionProvider = function (title) {
	'use strict';
	var text = new Kinetic.Idea({
		text: title
	});
	return {
		width: text.getWidth(),
		height: text.getHeight()
	};
};
