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
		currentlySelectedIdeaId,
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
					if (nodeId == currentlySelectedIdeaId) {
						currentlySelectedIdeaId = undefined;
					}
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
		};
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
	//Todo - clean up this shit below
	var currentDroppable,
		updateCurrentDroppable = function (value) {
			if (currentDroppable != value) {
				if (currentDroppable) {
					self.dispatchEvent('nodeDroppableChanged', currentDroppable, false);
				}
				currentDroppable = value;
				if (currentDroppable) {
					self.dispatchEvent('nodeDroppableChanged', currentDroppable, true);
				}
			}
		},
		canDropOnNode = function (id, x, y, node) {
			return id != node.id
				&& x >= node.x
				&& y >= node.y
				&& x <= node.x + node.width - 2 * 10
				&& y <= node.y + node.height - 2 * 10;
		};
	this.nodeDragMove = function (id, x, y) {
		var nodeId, node;
		for (nodeId in currentLayout.nodes) {
			node = currentLayout.nodes[nodeId];
			if (canDropOnNode(id, x, y, node)) {
				updateCurrentDroppable(nodeId);
				return;
			}
		}
		updateCurrentDroppable(undefined);
	};
	this.nodeDragEnd = function (id, x, y) {
		var nodeBeingDragged = currentLayout.nodes[id],
			nodeId,
			node,
			rootNode = currentLayout.nodes[idea.id],
			verticallyClosestNode;
		updateCurrentDroppable(undefined);
		self.dispatchEvent('nodeMoved', nodeBeingDragged);
		for (nodeId in currentLayout.nodes) {
			node = currentLayout.nodes[nodeId];
			if (canDropOnNode(id, x, y, node)) {
				if (!idea.changeParent(id, nodeId)) {
					self.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
				}
				return;
			} else if ((nodeBeingDragged.x === node.x || nodeBeingDragged.x + nodeBeingDragged.width === node.x + node.width) && y < node.y) {
				if (!verticallyClosestNode || node.y < verticallyClosestNode.y) {
					verticallyClosestNode = node;
				}
			}
		}
		if (rootNode.x < nodeBeingDragged.x && x < rootNode.x || rootNode.x > nodeBeingDragged.x && rootNode.x < x) {
			if (idea.flip(id)) {
				return;
			}
		}
		if (verticallyClosestNode) {
			if (idea.positionBefore(id, verticallyClosestNode.id)) {
				return;
			}
		}
		self.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
	};
};
