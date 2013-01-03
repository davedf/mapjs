/*global observable*/
var MAPJS = MAPJS || {};
MAPJS.MapModel = function (layoutCalculator) {
	'use strict';
	var self = this,
		currentLayout = {
			nodes: {},
			connectors: {}
		},
		idea,
		updateCurrentLayout = function (newLayout) {
			var nodeId, newNode, oldNode, newConnector, oldConnector;
			for (nodeId in currentLayout.connectors) {
				newConnector = newLayout.connectors[nodeId];
				oldConnector = currentLayout.connectors[nodeId];
				if (!newConnector || newConnector.from !== oldConnector.from || newConnector.to !== oldConnector.to) {
					self.dispatchEvent('connectorRemoved', oldConnector);
				}
			}
			for (nodeId in currentLayout.nodes) {
				oldNode = currentLayout.nodes[nodeId];
				newNode = newLayout.nodes[nodeId];
				if (!newNode) {
					self.dispatchEvent('nodeRemoved', oldNode);
				}
			}
			for (nodeId in newLayout.nodes) {
				oldNode = currentLayout.nodes[nodeId];
				newNode = newLayout.nodes[nodeId];
				if (!oldNode) {
					self.dispatchEvent('nodeCreated', newNode);
				} else {
					if (newNode.x !== oldNode.x || newNode.y !== oldNode.y) {
						self.dispatchEvent('nodeMoved', newNode);
					}
					if (newNode.title !== oldNode.title) {
						self.dispatchEvent('nodeTitleChanged', newNode);
					}
				}
			}
			for (nodeId in newLayout.connectors) {
				newConnector = newLayout.connectors[nodeId];
				oldConnector = currentLayout.connectors[nodeId];
				if (!oldConnector || newConnector.from !== oldConnector.from || newConnector.to !== oldConnector.to) {
					self.dispatchEvent('connectorCreated', newConnector);
				}
			}
			currentLayout = newLayout;
		},
		onIdeaChanged = function () {
			updateCurrentLayout(layoutCalculator(idea));
		},
		currentlySelectedIdeaId;
	observable(this);
	this.setIdea = function (anIdea) {
		if (idea) {
			idea.removeEventListener('changed', onIdeaChanged);
		}
		idea = anIdea;
		idea.addEventListener('changed', onIdeaChanged);
		onIdeaChanged();
	};
	this.selectNode = function (id) {
		if (id !== currentlySelectedIdeaId) {
			if (currentlySelectedIdeaId) {
				self.dispatchEvent('nodeSelectionChanged', currentlySelectedIdeaId, false);
			}
			currentlySelectedIdeaId = id;
			self.dispatchEvent('nodeSelectionChanged', id, true);
		}
	};
	this.addSubIdea = function (title) {
		idea.addSubIdea(currentlySelectedIdeaId, title || 'double click to edit');
	};
	this.removeSubIdea = function () {
		idea.removeSubIdea(currentlySelectedIdeaId);
	};
	this.updateTitle = function (title) {
		idea.updateTitle(currentlySelectedIdeaId, title);
	};

	var currentDroppable,
		updateCurrentDroppable = function (value) {
			if (currentDroppable !== value) {
				if (currentDroppable) {
					self.dispatchEvent('nodeDroppableChanged', currentDroppable, false);
				}
				currentDroppable = value;
				if (currentDroppable) {
					self.dispatchEvent('nodeDroppableChanged', currentDroppable, true);
				}
			}
		};
	this.nodeDragMove = function (id, x, y) {
		var nodeId, node;
		for (nodeId in currentLayout.nodes) {
			node = currentLayout.nodes[nodeId];
			if (nodeId !== id && x >= node.x && y >= node.y && x <= node.x + (node.width || 50) && y <= node.y + (node.height || 50) && nodeId !== currentDroppable) {
				updateCurrentDroppable(nodeId);
				return;
			}
		}
		updateCurrentDroppable(undefined);
	};
	this.dropNode = function (id, x, y) {
		var nodeId, node;
		updateCurrentDroppable(undefined);
		for (nodeId in currentLayout.nodes) {
			node = currentLayout.nodes[nodeId];
			if (nodeId !== id && x >= node.x && y >= node.y && x <= node.x + (node.width || 50) && y <= node.y + (node.height || 50)) {
				if (!idea.changeParent(id, nodeId)) {
					self.dispatchEvent('nodeMoved', currentLayout.nodes[id]);
				}
				return;
			}
		}
		self.dispatchEvent('nodeMoved', currentLayout.nodes[id]);
	};
};
