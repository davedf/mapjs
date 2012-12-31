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
			text: n.text
		});
		nodeByIdeaId[n.id] = node;
		layer.add(node);
		node.transitionTo({
			opacity: 1,
			duration: 0.5
		});
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
	mapModel.addEventListener('connectorCreated', function (n) {
		var connector = new Kinetic.Connector({
			shapeFrom: nodeByIdeaId[n.fromNode],
			shapeTo: nodeByIdeaId[n.toNode],
			stroke: '#888',
			strokeWidth: 2,
			opacity: 0
		});
		connector.opacity = 0;
		connectorByFromIdeaId_ToIdeaId[connectorKey(n.fromNode, n.toNode)] = connector;
		layer.add(connector);
		connector.transitionTo({
			opacity: 1,
			duration: 0.5
		});
	});
	mapModel.addEventListener('connectorRemoved', function (n) {
		var key = connectorKey(n.fromNode, n.toNode),
			connector = connectorByFromIdeaId_ToIdeaId[key];
		delete connectorByFromIdeaId_ToIdeaId[key];
		connector.transitionTo({
			opacity: 0.25,
			duration: 0.5,
			callback: connector.remove.bind(connector)
		});
	});
};
