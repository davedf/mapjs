var MAPJS = MAPJS || {};
MAPJS.KineticMediator = function (mapModel, layer) {
	var nodeByIdeaId = {},
		connectorByFromIdeaId_ToIdeaId = {},
		getTextOptions = function (x, y, label) {
			return {
				x: x,
				y: y,
				opacity: 0,
				stroke: '#888',
				strokeWidth: 3,
				fill: '#ddd',
				text: label,
				fontSize: 11,
				fontFamily: 'Calibri',
				textFill: '#555',
				padding: 12,
				align: 'center',
				fontStyle: 'italic',
				shadow: {
					color: 'black',
					blur: 10,
					offset: [8, 8],
					opacity: 0.2
				},
				cornerRadius: 10,
				draggable: true
			};
		};
	mapModel.addEventListener('nodeCreated', function (n) {
		var node = new Kinetic.Text(getTextOptions(n.x, n.y, n.text));
		nodeByIdeaId[n.id] = node;
		layer.add(node);
		node.transitionTo({
			opacity: 1,
			duration: 0.5
		});
	});
	mapModel.addEventListener('nodeRemoved', function (n) {
		var node = nodeByIdeaId[n.id];
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
	var connectorKey = function (ideaFromId, ideaToId) {
		return ideaFromId + '_' + ideaToId;
	};
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
		var connector = connectorByFromIdeaId_ToIdeaId[connectorKey(n.fromNode, n.toNode)];
		connector.transitionTo({
			opacity: 0.25,
			duration: 0.5,
			callback: connector.remove.bind(connector)
		});
	});
};
