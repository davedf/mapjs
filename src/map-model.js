/*global observable*/
var MAPJS = MAPJS || {};
MAPJS.MapModel = function (layoutCalculator, titlesToRandomlyChooseFrom) {
	'use strict';
	titlesToRandomlyChooseFrom = titlesToRandomlyChooseFrom || ['double click to edit'];
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
						self.selectNode(idea.id);
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
		self.selectNode(idea.id);
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
	var parentNode = function (root, id) {
		var rank, childResult;
		for (rank in root.ideas) {
			if (root.ideas[rank].id === id) {
				return root;
			}
			childResult = parentNode(root.ideas[rank], id);
			if (childResult) {
				return childResult;
			}
		}
	};
	var isRootOrRightHalf = function (id) {
		return currentLayout.nodes[id].x >= currentLayout.nodes[idea.id].x;
	};
	var isRootOrLeftHalf = function (id) {
		return currentLayout.nodes[id].x <= currentLayout.nodes[idea.id].x;
	};
	this.selectNodeLeft = function () {
		var node,
			rank,
			isRoot = currentlySelectedIdeaId === idea.id,
			targetRank = isRoot ? -Infinity : Infinity,
			targetNode;
		if (isRootOrLeftHalf(currentlySelectedIdeaId)) {
			node = idea.id === currentlySelectedIdeaId ? idea : idea.findSubIdeaById(currentlySelectedIdeaId);
			for (rank in node.ideas) {
				rank = parseFloat(rank);
				if (isRoot && rank < 0 && rank > targetRank || !isRoot && rank > 0 && rank < targetRank) {
					targetRank = rank;
				}
			}
			if (targetRank !== Infinity && targetRank !== -Infinity) {
				self.selectNode(node.ideas[targetRank].id);
			}
		} else {
			self.selectNode(parentNode(idea, currentlySelectedIdeaId).id);
		}
	};
	this.selectNodeRight = function () {
		var node, rank, minimumPositiveRank = Infinity;
		if (isRootOrRightHalf(currentlySelectedIdeaId)) {
			node = idea.id === currentlySelectedIdeaId ? idea : idea.findSubIdeaById(currentlySelectedIdeaId);
			for (rank in node.ideas) {
				rank = parseFloat(rank);
				if (rank > 0 && rank < minimumPositiveRank) {
					minimumPositiveRank = rank;
				}
			}
			if (minimumPositiveRank !== Infinity) {
				self.selectNode(node.ideas[minimumPositiveRank].id);
			}
		} else {
			self.selectNode(parentNode(idea, currentlySelectedIdeaId).id);
		}
	};
	var currentlySelectedIdeaRank = function (parent) {
		var rank;
		for (rank in parent.ideas) {
			rank = parseFloat(rank);
			if (parent.ideas[rank].id === currentlySelectedIdeaId) {
				return rank;
			}
		}
	};
	this.selectNodeUp = function () {
		var parent = parentNode(idea, currentlySelectedIdeaId), myRank, previousSiblingRank, rank;
		if (parent) {
			myRank = currentlySelectedIdeaRank(parent);
			previousSiblingRank = myRank > 0 ? -Infinity : Infinity;
			for (rank in parent.ideas) {
				rank = parseFloat(rank);
				if (myRank < 0 && rank < 0 && rank > myRank && rank < previousSiblingRank || myRank > 0 && rank > 0 && rank < myRank && rank > previousSiblingRank) {
					previousSiblingRank = rank;
				}
			}
			if (previousSiblingRank !== Infinity && previousSiblingRank !== -Infinity) {
				self.selectNode(parent.ideas[previousSiblingRank].id);
			}
		}
	};
	this.selectNodeDown = function () {
		var parent = parentNode(idea, currentlySelectedIdeaId), myRank, nextSiblingRank, rank;
		if (parent) {
			myRank = currentlySelectedIdeaRank(parent);
			nextSiblingRank = myRank > 0 ? Infinity : -Infinity;
			for (rank in parent.ideas) {
				rank = parseFloat(rank);
				if (myRank < 0 && rank < 0 && rank < myRank && rank > nextSiblingRank || myRank > 0 && rank > 0 && rank > myRank && rank < nextSiblingRank) {
					nextSiblingRank = rank;
				}
			}
			if (nextSiblingRank !== Infinity && nextSiblingRank !== -Infinity) {
				self.selectNode(parent.ideas[nextSiblingRank].id);
			}
		}
	};
	this.addSubIdea = function (title) {
		idea.addSubIdea(currentlySelectedIdeaId, title || titlesToRandomlyChooseFrom[Math.floor(titlesToRandomlyChooseFrom.length * Math.random())]);
	};
	this.removeSubIdea = function () {
		idea.removeSubIdea(currentlySelectedIdeaId);
	};
	this.updateTitle = function (title) {
		idea.updateTitle(currentlySelectedIdeaId, title);
	};
	this.editNode = function () {
		self.dispatchEvent('nodeEditRequested:' + currentlySelectedIdeaId, {});
	};
	this.clear = function () {
		idea.clear();
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
			verticallyClosestNode = { id: null, y: Infinity };
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
		if (idea.positionBefore(id, verticallyClosestNode.id)) {
			return;
		}
		self.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
	};
};
