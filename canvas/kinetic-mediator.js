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
		var node = new Kinetic.Idea({
			x: n.x,
			y: n.y,
			text: n.title,
			opacity: 0
		});
		nodeByIdeaId[n.id] = node;
		layer.add(node);
		node.transitionTo({
			opacity: 1,
			duration: 0.5
		});
	});
	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
		var node = nodeByIdeaId[ideaId];
		node.setIsSelected(isSelected);
	});
	mapModel.addEventListener('nodeRemoved', function (n) {
		var node = nodeByIdeaId[n.id];
		delete nodeByIdeaId[n.id];
		node.transitionTo({
			opacity: 0.25,
			duration: 0.5,
			callback: node.remove.bind(node)
		});
	});
	mapModel.addEventListener('nodeMoved', function (n) {
		var node = nodeByIdeaId[n.id];
		node.transitionTo({
			x: n.x,
			y: n.y,
			duration: 0.5
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
			strokeWidth: 2,
			opacity: 0
		});
		connector.opacity = 0;
		connectorByFromIdeaId_ToIdeaId[connectorKey(n.from, n.to)] = connector;
		layer.add(connector);
		connector.transitionTo({
			opacity: 1,
			duration: 0.5
		});
	});
	mapModel.addEventListener('connectorRemoved', function (n) {
		var key = connectorKey(n.from, n.to),
			connector = connectorByFromIdeaId_ToIdeaId[key];
		delete connectorByFromIdeaId_ToIdeaId[key];
		connector.transitionTo({
			opacity: 0.25,
			duration: 0.5,
			callback: connector.remove.bind(connector)
		});
	});
};
