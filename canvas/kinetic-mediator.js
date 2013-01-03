/*global Kinetic*/
var MAPJS = MAPJS || {};
MAPJS.KineticMediator = function (mapModel, layer) {
	'use strict';
	var nodeByIdeaId = {},
		connectorByFromIdeaId_ToIdeaId = {},
		connectorKey = function (fromIdeaId, toIdeaId) {
			return fromIdeaId + '_' + toIdeaId;
		};
	mapModel.addEventListener('nodeCreated', function (n) {
		console.log('nodeCreated');
		var node = new Kinetic.Idea({
			x: n.x,
			y: n.y,
			text: n.title,
			opacity: 0
		});
		node.on('click tap', mapModel.selectNode.bind(mapModel, n.id));
		node.on('dragstart', node.moveToTop.bind(node));
		node.on('dragmove', function () {
			mapModel.nodeDragMove(
				n.id,
				node.attrs.x,
				node.attrs.y
			);
		});
		node.on('dragend', function () {
			mapModel.dropNode(
				n.id,
				node.attrs.x + 0.5 * node.getWidth(),
				node.attrs.y + 0.5 * node.getHeight()
			);
		});
		nodeByIdeaId[n.id] = node;
		layer.add(node);
		node.transitionTo({
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
		node.transitionTo({
			opacity: isDroppable ? 0.5 : 1,
			duration: 0.4
		});
	});
	mapModel.addEventListener('nodeRemoved', function (n) {
		console.log('nodeRemoved');
		var node = nodeByIdeaId[n.id];
		delete nodeByIdeaId[n.id];
		node.transitionTo({
			opacity: 0.25,
			duration: 0.4,
			callback: node.remove.bind(node)
		});
	});
	mapModel.addEventListener('nodeMoved', function (n) {
		console.log('nodeMoved');
		var node = nodeByIdeaId[n.id];
		node.transitionTo({
			x: n.x,
			y: n.y,
			duration: 0.4,
			easing: 'ease-in-out'
		});
	});
	mapModel.addEventListener('nodeTitleChanged', function (n) {
		console.log('nodeTitleChanged');
		var node = nodeByIdeaId[n.id];
		node.setText(n.title);
		layer.draw();
	});
	mapModel.addEventListener('connectorCreated', function (n) {
		console.log('connectorCreated');
		var connector = new Kinetic.Connector({
			shapeFrom: nodeByIdeaId[n.from],
			shapeTo: nodeByIdeaId[n.to],
			stroke: '#888',
			strokeWidth: 2,
			opacity: 0
		});
		connector.opacity = 0;
		connectorByFromIdeaId_ToIdeaId[connectorKey(n.from, n.to)] = connector;
		layer.add(connector);
		connector.transitionTo({
			opacity: 1,
			duration: 0.4
		});
	});
	mapModel.addEventListener('connectorRemoved', function (n) {
		console.log('connectorRemoved');
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
			8: mapModel.removeSubIdea.bind(mapModel)
		};
		$(document).keydown(function (evt) {
			var eventHandler = keyboardEventHandlers[evt.which];
			if (eventHandler) {
				eventHandler();
				evt.preventDefault();
			}
		});
	}());
};
