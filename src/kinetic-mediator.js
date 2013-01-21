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
		});
		node.on(':nodeEditRequested', mapModel.editNode.bind(mapModel, false));
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
		stagePosition = {
			x: stage.attrs.x,
			y: stage.attrs.y
		},

			finalStagePosition = {
				x: stage.attrs.x,
				y: stage.attrs.y
			},
			scale = stage.getScale().x || 1,
			offset = 20;
			console.log ('-->finalStagePosition',finalStagePosition.x,finalStagePosition.y)
  		
		console.log(
			'nodeSelectionChanged',
			ideaId,
			'nap',
			node.getAbsolutePosition().x,
			node.getAbsolutePosition().y,
			'node width height',
			node.getWidth(),
			node.getHeight(),
			'stage width height',
			stage.getWidth(),
			stage.getHeight(),
			'node x y',
			node.attrs.x,
			node.attrs.y,
			'stage x y',
			stage.attrs.x,
			stage.attrs.y
		);
		var movex = 0;
		if (node.getAbsolutePosition().x + node.getWidth() * scale + offset > stage.getWidth()) {
		  var movex = stage.getWidth() - (node.getAbsolutePosition().x + node.getWidth() * scale + offset);		  
			finalStagePosition.x = stagePosition.x + movex;
		} else if (node.getAbsolutePosition().x < offset) {
		  var movex  = offset - node.getAbsolutePosition().x;
		  finalStagePosition.x = stagePosition.x + movex;
		}
		finalStagePosition.x = stagePosition.x + movex;
		if (node.getAbsolutePosition().y + node.getHeight() * scale + offset > stage.getHeight()) {
		  var movey = stage.getHeight() - (node.getAbsolutePosition().y + node.getHeight() * scale + offset);
			finalStagePosition.y = stagePosition.y + movey;
		} else if (node.getAbsolutePosition().y < offset) {
		  var movey = offset - node.getAbsolutePosition().y;
			finalStagePosition.y = stagePosition.y + movey;
		}
		console.log ('<--finalStagePosition',finalStagePosition.x,finalStagePosition.y)
		
		stage.transitionTo({
			x: finalStagePosition.x,
			y: finalStagePosition.y,
			duration: 0.4,
			easing: 'ease-in-out'
		});
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
	mapModel.addEventListener('mapScaleChanged', function (isScaleUp) {
		var scale = stage.getScale();
		scale.y = scale.x = (scale.x || 1) * (isScaleUp ? 1.25 : 0.8);
		stage.setScale(scale);
		stage.draw();
	});
	(function () {
		var keyboardEventHandlers = {
			13: mapModel.addSiblingIdea,
			8: mapModel.removeSubIdea,
			9: mapModel.addSubIdea,
			37: mapModel.selectNodeLeft,
			38: mapModel.selectNodeUp,
			39: mapModel.selectNodeRight,
			40: mapModel.selectNodeDown,
			46: mapModel.removeSubIdea,
			32: mapModel.editNode
		},
			onKeydown = function (evt) {
				var eventHandler = keyboardEventHandlers[evt.which];
				if (eventHandler) {
					eventHandler();
					evt.preventDefault();
				}
			};
		jQuery(document).keydown(onKeydown);
		mapModel.addEventListener('inputEnabledChanged', function (isInputEnabled) {
			jQuery(document)[isInputEnabled ? 'bind' : 'unbind']('keydown', onKeydown);
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
