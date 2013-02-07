/*global _, observable*/
/*jslint forin: true*/
var MAPJS = MAPJS || {};
MAPJS.MapModel = function (mapRepository, layoutCalculator, titlesToRandomlyChooseFrom, intermediaryTitlesToRandomlyChooseFrom) {
	'use strict';
	titlesToRandomlyChooseFrom = titlesToRandomlyChooseFrom || ['double click to edit'];
	intermediaryTitlesToRandomlyChooseFrom = intermediaryTitlesToRandomlyChooseFrom || titlesToRandomlyChooseFrom;
	var self = this,
		analytic,
		currentLayout = {
			nodes: {},
			connectors: {}
		},
		idea,
		isInputEnabled,
		currentlySelectedIdeaId,
		getRandomTitle = function (titles) {
			return titles[Math.floor(titles.length * Math.random())];
		},
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
				nodeId = parseFloat(nodeId);
				oldNode = currentLayout.nodes[nodeId];
				newNode = newLayout.nodes[nodeId];
				if (!newNode) {
					if (nodeId === currentlySelectedIdeaId) {
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
					if (!_.isEqual(newNode.style || {}, oldNode.style || {})) {
						self.dispatchEvent('nodeStyleChanged', newNode);
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
		onIdeaChanged = function (command, args) {
			var newIdeaId;
			updateCurrentLayout(layoutCalculator(idea));
			if (command === 'addSubIdea') {
				newIdeaId = args[2];
				self.selectNode(newIdeaId);
				self.editNode(false, true);
			}
			if (command === 'insertIntermediate') {
				newIdeaId = args[2];
				self.selectNode(newIdeaId);
				self.editNode(false, true);
			}
		},
		currentlySelectedIdea = function () {
			return (idea.findSubIdeaById(currentlySelectedIdeaId) || idea);
		},
		ensureNodeIsExpanded = function (source, nodeId) {
			var node = idea.findSubIdeaById(nodeId) || idea;
			if (node.getStyle('collapsed')) {
				idea.updateStyle(nodeId, 'collapsed', false);
			}
		};
	observable(this);
	analytic = self.dispatchEvent.bind(self, 'analytic', 'mapModel');
	this.setIdea = function (anIdea) {
		if (idea) {
			idea.removeEventListener('changed', onIdeaChanged);
		}
		idea = anIdea;
		idea.addEventListener('changed', onIdeaChanged);
		onIdeaChanged();
		self.selectNode(idea.id);
	};
	mapRepository.addEventListener('mapLoaded', this.setIdea);
	this.setInputEnabled = function (value) {
		if (isInputEnabled !== value) {
			isInputEnabled = value;
			self.dispatchEvent('inputEnabledChanged', value);
		}
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
	this.toggleCollapse = function (source) {
		var isCollapsed = currentlySelectedIdea().getStyle('collapsed');
		this.collapse(source, !isCollapsed);
	};
	this.collapse = function (source, doCollapse) {
		analytic('collapse:' + doCollapse, source);
		var node = currentlySelectedIdea();
		if (node.ideas && _.size(node.ideas) > 0) {
			idea.updateStyle(currentlySelectedIdeaId, 'collapsed', doCollapse);
		}
	};
	this.addSubIdea = function (source) {
		analytic('addSubIdea', source);
		ensureNodeIsExpanded(source, currentlySelectedIdeaId);
		idea.addSubIdea(currentlySelectedIdeaId, getRandomTitle(titlesToRandomlyChooseFrom));
	};
	this.insertIntermediate = function (source) {
		if (currentlySelectedIdeaId === idea.id) {
			return false;
		}
		idea.insertIntermediate(currentlySelectedIdeaId, getRandomTitle(intermediaryTitlesToRandomlyChooseFrom));
		analytic('insertIntermediate', source);
	};
	this.addSiblingIdea = function (source) {
		analytic('addSiblingIdea', source);
		var parent = idea.findParent(currentlySelectedIdeaId) || idea;
		idea.addSubIdea(parent.id, getRandomTitle(titlesToRandomlyChooseFrom));
	};
	this.removeSubIdea = function (source) {
		analytic('removeSubIdea', source);
		var parent = idea.findParent(currentlySelectedIdeaId);
		if (idea.removeSubIdea(currentlySelectedIdeaId)) {
			self.selectNode(parent.id);
		}
	};
	this.updateTitle = function (ideaId, title) {
		idea.updateTitle(ideaId, title);
	};
	this.editNode = function (source, shouldSelectAll) {
		if (source) {
			analytic('editNode', source);
		}
		var title = currentlySelectedIdea().title;
		if (intermediaryTitlesToRandomlyChooseFrom.indexOf(title) !== -1 ||
				 titlesToRandomlyChooseFrom.indexOf(title) !== -1) {
			shouldSelectAll = true;
		}
		self.dispatchEvent('nodeEditRequested:' + currentlySelectedIdeaId, shouldSelectAll);

	};
	this.scaleUp = function (source) {
		self.dispatchEvent('mapScaleChanged', true);
		analytic('scaleUp', source);
	};
	this.scaleDown = function (source) {
		self.dispatchEvent('mapScaleChanged', false);
		analytic('scaleDown', source);
	};
	(function () {
		var isRootOrRightHalf = function (id) {
				return currentLayout.nodes[id].x >= currentLayout.nodes[idea.id].x;
			},
			isRootOrLeftHalf = function (id) {
				return currentLayout.nodes[id].x <= currentLayout.nodes[idea.id].x;
			},
			nodesWithIDs = function () {
				return _.map(currentLayout.nodes,
					function (n, nodeId) {
						return _.extend({ id: parseInt(nodeId, 10)}, n);
					});
			};
		self.selectNodeLeft = function (source) {
			var node,
				rank,
				isRoot = currentlySelectedIdeaId === idea.id,
				targetRank = isRoot ? -Infinity : Infinity,
				targetNode;
			analytic('selectNodeLeft', source);
			if (isRootOrLeftHalf(currentlySelectedIdeaId)) {
				node = idea.id === currentlySelectedIdeaId ? idea : idea.findSubIdeaById(currentlySelectedIdeaId);
				ensureNodeIsExpanded(source, node.id);
				for (rank in node.ideas) {
					rank = parseFloat(rank);
					if ((isRoot && rank < 0 && rank > targetRank) || (!isRoot && rank > 0 && rank < targetRank)) {
						targetRank = rank;
					}
				}
				if (targetRank !== Infinity && targetRank !== -Infinity) {
					self.selectNode(node.ideas[targetRank].id);
				}
			} else {
				self.selectNode(idea.findParent(currentlySelectedIdeaId).id);
			}
		};
		self.selectNodeRight = function (source) {
			var node, rank, minimumPositiveRank = Infinity;
			analytic('selectNodeRight', source);
			if (isRootOrRightHalf(currentlySelectedIdeaId)) {
				node = idea.id === currentlySelectedIdeaId ? idea : idea.findSubIdeaById(currentlySelectedIdeaId);
				ensureNodeIsExpanded(source, node.id);
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
				self.selectNode(idea.findParent(currentlySelectedIdeaId).id);
			}
		};

		self.selectNodeUp = function (source) {
			var previousSibling = idea.previousSiblingId(currentlySelectedIdeaId),
				nodesAbove,
				closestNode,
				currentNode = currentLayout.nodes[currentlySelectedIdeaId];
			analytic('selectNodeUp', source);
			if (previousSibling) {
				self.selectNode(previousSibling);
			} else {
				if (!currentNode) return;
				nodesAbove = _.reject(nodesWithIDs(), function (node) { return node.y >= currentNode.y; });
				if (_.size(nodesAbove) === 0) {
					return;
				}
				closestNode = _.min(nodesAbove, function (node) {
					return Math.pow(node.x - currentNode.x, 2) + Math.pow(node.y - currentNode.y, 2);
				});
				self.selectNode(closestNode.id);
			}
		};
		self.selectNodeDown = function (source) {
			var nextSibling = idea.nextSiblingId(currentlySelectedIdeaId),
				nodesBelow,
				closestNode,
				currentNode = currentLayout.nodes[currentlySelectedIdeaId];
			analytic('selectNodeDown', source);
			if (nextSibling) {
				self.selectNode(nextSibling);
			} else {
				if (!currentNode) return;
				nodesBelow = _.reject(nodesWithIDs(), function (node) { return node.y <= currentNode.y; });
				if (_.size(nodesBelow) === 0) {
					return;
				}
				closestNode = _.min(nodesBelow, function (node) {
					return Math.pow(node.x - currentNode.x, 2) + Math.pow(node.y - currentNode.y, 2);
				});
				self.selectNode(closestNode.id);
			}

		};
	}());
	//Todo - clean up this shit below
	(function () {
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
			},
			canDropOnNode = function (id, x, y, node) {
				return id !== node.id
					&& x >= node.x
					&& y >= node.y
					&& x <= node.x + node.width - 2 * 10
					&& y <= node.y + node.height - 2 * 10;
			},
			tryFlip = function (rootNode, nodeBeingDragged, nodeDragEndX) {
				var flipRightToLeft = rootNode.x < nodeBeingDragged.x && nodeDragEndX < rootNode.x,
					flipLeftToRight = rootNode.x > nodeBeingDragged.x && rootNode.x < nodeDragEndX;
				if (flipRightToLeft || flipLeftToRight) {
					return idea.flip(nodeBeingDragged.id);
				}
				return false;
			};
		self.nodeDragMove = function (id, x, y) {
			var nodeId, node;
			for (nodeId in currentLayout.nodes) {
				nodeId = parseFloat(nodeId);
				node = currentLayout.nodes[nodeId];
				if (canDropOnNode(id, x, y, node)) {
					updateCurrentDroppable(nodeId);
					return;
				}
			}
			updateCurrentDroppable(undefined);
		};
		self.nodeDragEnd = function (id, x, y) {
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
				}
				if ((nodeBeingDragged.x === node.x || nodeBeingDragged.x + nodeBeingDragged.width === node.x + node.width) && y < node.y) {
					if (!verticallyClosestNode || node.y < verticallyClosestNode.y) {
						verticallyClosestNode = node;
					}
				}
			}
			if (tryFlip(rootNode, nodeBeingDragged, x)) {
				return;
			}
			if (idea.positionBefore(id, verticallyClosestNode.id)) {
				return;
			}
			self.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
		};
	}());
};
