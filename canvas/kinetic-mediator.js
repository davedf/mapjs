/*global console, document, jQuery, Kinetic*/
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
		nodeByIdeaId[n.id] = node;
		layer.add(node);
		node.transitionTo({
			opacity: 1,
			duration: 0.4
		});
	});
	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
		console.log('nodeSelectionChanged');
		var node = nodeByIdeaId[ideaId];
		node.setIsSelected(isSelected);
	});
	mapModel.addEventListener('nodeDroppableChanged', function (ideaId, isDroppable) {
		console.log('nodeDroppableChanged', ideaId, isDroppable);
		var node = nodeByIdeaId[ideaId];
		node.setIsDroppable(isDroppable);
		//node.attrs.fill = isDroppable ? '#ecc' : '#ddd';
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
	mapModel.addEventListener('nodeMoved', function (n, reason) {
		console.log('nodeMoved', reason);
		var node = nodeByIdeaId[n.id];
		node.transitionTo({
			x: n.x,
			y: n.y,
			duration: 0.4,
			easing: (reason === 'failed' ? 'bounce-ease-out' : 'ease-in-out')
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
			strokeWidth: 1,
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
		jQuery(document).keydown(function (evt) {
			var eventHandler = keyboardEventHandlers[evt.which];
			if (eventHandler) {
				eventHandler();
				evt.preventDefault();
			}
		});
	}());
};
