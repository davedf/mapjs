var observable = function (base) {
	'use strict';
	var eventListenersByType = {}, eventSinks = [];
	base.addEventListener = function (type, listener) {
		eventListenersByType[type] = eventListenersByType[type] || [];
		eventListenersByType[type].push(listener);
	};
	base.listeners = function (type) {
		var listenersByType = eventListenersByType[type] || [], result = [], i;
		for (i = listenersByType.length - 1; i >= 0; i -= 1) {
			result.push(listenersByType[i]);
		}
		return result;
	};
	base.removeEventListener = function (type, listener) {
		if (eventListenersByType[type]) {
			eventListenersByType[type] = eventListenersByType[type].filter(
				function (currentListener) {
					return currentListener !== listener;
				}
			);
		}
	};
	base.addEventSink = eventSinks.push.bind(eventSinks);
	base.dispatchEvent = function (eventType) {
		var eventArguments, listeners, i;
		eventArguments = Array.prototype.slice.call(arguments, 1);
		for (i = 0; i < eventSinks.length; i += 1) {
			eventSinks[i].apply(base, arguments);
		}
		listeners = base.listeners(eventType);
		for (i = 0; i < listeners.length; i += 1) {
			if (listeners[i].apply(base, eventArguments) === false) {
				break;
			}
		}
	};
	return base;
};
var content;

(function () {
  content = function (contentAggregate) {
    var init = function (contentIdea) {
      if (contentIdea.ideas)
        _.each(contentIdea.ideas, function (value, key) {
          contentIdea.ideas[key] = init(value);
        });
      contentIdea.id = contentIdea.id || (contentAggregate.maxId() + 1);
      contentIdea.containsDirectChild=contentIdea.findChildRankById = function (childIdeaId) {
        return parseFloat(_.reduce(
          contentIdea.ideas,
          function(res, value, key) {
            return value.id == childIdeaId ? key : res;
          },
          undefined
        ));
      };
      contentIdea.findSubIdeaById = function(childIdeaId){
        var myChild= _.find(contentIdea.ideas,function(idea){return idea.id==childIdeaId;})
        return myChild ||
          _.reduce (contentIdea.ideas, function(result,idea){
             return result || idea.findSubIdeaById(childIdeaId);
          },
          undefined);
      };
      return contentIdea;
    };
    contentAggregate.maxId = function maxId(idea) {
      idea = idea || contentAggregate;
      if (!idea.ideas)
        return idea.id || 0;
      return _.reduce(
        idea.ideas,
        function (result, subidea){
          return Math.max(result, maxId(subidea));
        },
        idea.id || 0
      );
    };


    /*** private utility methods ***/
    maxKey=function(kv_map,sign){
      sign=sign||1;
      if (_.size(kv_map)==0) return 0;
      var current_keys=_.keys(kv_map);
      current_keys.push(0); /* ensure at least 0 is there for negative ranks */
      return _.max(_.map(current_keys,parseFloat),function(x){return x*sign});
    }
    nextChildRank=function(parentIdea){
      var childRankSign=1;
      if (parentIdea.id==contentAggregate.id){
        counts= _.countBy(parentIdea.ideas, function(v,k){ return k<0; });
        if ((counts.true||0)<counts.false) childRankSign=-1;
      }
      var new_rank=maxKey(parentIdea.ideas,childRankSign)+childRankSign;
      return new_rank;
    }
    appendSubIdea=function(parentIdea,subIdea){
      if (!parentIdea.ideas) parentIdea.ideas={}

      parentIdea.ideas[nextChildRank(parentIdea)]=subIdea;
    }
    findIdeaById = function (ideaId){
      return contentAggregate.id==ideaId?contentAggregate:contentAggregate.findSubIdeaById(ideaId);
    }
    traverseAndRemoveIdea = function (parentIdea,subIdeaId) {
      var childRank=parentIdea.findChildRankById(subIdeaId);
      if (childRank){
        var deleted= parentIdea.ideas[childRank];
        delete parentIdea.ideas[childRank];
        return deleted;
      }
      return _.reduce(
        parentIdea.ideas,
        function (result, child) {
          return result || traverseAndRemoveIdea(child,subIdeaId);
        },
        false
      );
    }
    /* intentionally not returning 0 case, to help with split sorting into 2 groups */
    sign=function(number){
      return number<0?-1:1;
    }
    /**** aggregate command processing methods ****/
    contentAggregate.flip = function (ideaId){
      var current_rank=contentAggregate.findChildRankById(ideaId);
      if (!current_rank) return false;
      var max_rank = maxKey(contentAggregate.ideas,-1*sign(current_rank));
      new_rank = max_rank - 10 * sign(current_rank);
      contentAggregate.ideas[new_rank] = contentAggregate.ideas[current_rank];
      delete contentAggregate.ideas[current_rank];
      contentAggregate.dispatchEvent('flip',ideaId);
      contentAggregate.dispatchEvent('changed',undefined);
      return true;
    }
    contentAggregate.updateTitle = function (ideaId, title) {
      var idea=findIdeaById(ideaId);
      if (!idea) return false;
      idea.title=title;
      contentAggregate.dispatchEvent('updateTitle', ideaId,title);
      contentAggregate.dispatchEvent('changed',undefined);
      return true;
    };
    contentAggregate.addSubIdea = function(parentId,ideaTitle){
      var newId=arguments[2];
      if (newId && findIdeaById(newId)) return false;
      var parent=findIdeaById(parentId);
      if (!parent) return false;
      var newIdea=init({title:ideaTitle,id:(newId||(contentAggregate.maxId()+1))});
      appendSubIdea(parent,newIdea);
      contentAggregate.dispatchEvent('addSubIdea',parentId,ideaTitle,newIdea.id);
      contentAggregate.dispatchEvent('changed',undefined);
      return true;
    }
    contentAggregate.removeSubIdea = function (subIdeaId){
      var result = traverseAndRemoveIdea(contentAggregate,subIdeaId);
      if (result) {
        contentAggregate.dispatchEvent('removeSubIdea',subIdeaId);
        contentAggregate.dispatchEvent('changed',undefined);
      }
      return result;
    }
    contentAggregate.changeParent = function (ideaId, newParentId){
      if (ideaId==newParentId) return false;
      var parent=findIdeaById(newParentId);
      if (!parent) return false;
      var idea=contentAggregate.findSubIdeaById(ideaId);
      if (!idea) return false;
      if (idea.findSubIdeaById(newParentId)) return false;
      if (parent.containsDirectChild(ideaId)) return false;
      traverseAndRemoveIdea(contentAggregate,ideaId);
      if (!idea) return false;
      appendSubIdea(parent,idea);
      contentAggregate.dispatchEvent('changeParent',ideaId,newParentId);
      contentAggregate.dispatchEvent('changed',undefined);
      return true;
    }
    contentAggregate.positionBefore = function (ideaId, positionBeforeIdeaId) {
      var parentIdea = arguments[2] || contentAggregate;
      var current_rank=parentIdea.findChildRankById(ideaId);
      if (!current_rank)
        return _.reduce(
          parentIdea.ideas,
          function (result, idea) {
            return result || contentAggregate.positionBefore(ideaId, positionBeforeIdeaId, idea)
          },
          false
        );
      if (ideaId == positionBeforeIdeaId)
        return false;
      var new_rank = 0;
      if (positionBeforeIdeaId) {
        var after_rank = parentIdea.findChildRankById(positionBeforeIdeaId);
        if (!after_rank) return false;
        var sibling_ranks=_(_.map(_.keys(parentIdea.ideas), parseFloat)).reject(function(k){return k*current_rank<0});
        var siblings_between=_.reject(_.sortBy(sibling_ranks,Math.abs),function(k){ return Math.abs(k)>=Math.abs(after_rank) });
        var before_rank = siblings_between.length > 0 ? _.max(siblings_between) : 0;
        if (before_rank == current_rank)
          return false;
        new_rank = before_rank + (after_rank - before_rank) / 2;
      } else {
        var max_rank = maxKey(parentIdea.ideas,current_rank<0?-1:1);
        if (max_rank == current_rank)
          return false;
        new_rank = max_rank + 10 * (current_rank < 0 ? -1 : 1);
      }
      parentIdea.ideas[new_rank] = parentIdea.ideas[current_rank];
      delete parentIdea.ideas[current_rank];
      contentAggregate.dispatchEvent('positionBefore',ideaId,positionBeforeIdeaId);
      contentAggregate.dispatchEvent('changed',undefined);
      return true;
    }
    contentAggregate.clear = function () {
      delete contentAggregate.ideas;
      contentAggregate.dispatchEvent('clear', undefined);
      contentAggregate.dispatchEvent('changed', undefined);
    }
    init(contentAggregate);
    return observable(contentAggregate);
  }
})();
/*jslint forin: true*/
var MAPJS = MAPJS || {};
(function () {
	'use strict';
	MAPJS.calculateDimensions = function calculateDimensions(idea, dimensionProvider, margin) {
		var dimensions = dimensionProvider(idea.title),
			result = {
				id: idea.id,
				width: dimensions.width + 2 * margin,
				height: dimensions.height + 2 * margin,
				title: idea.title
			},
			leftOrRight,
			subIdeaWidths = [0, 0],
			subIdeaHeights = [0, 0],
			subIdeaRank,
			subIdea,
			subIdeaDimensions;
		if (idea.ideas) {
			result.ideas = {};
			for (subIdeaRank in idea.ideas) {
				subIdea = idea.ideas[subIdeaRank];
				subIdeaDimensions = calculateDimensions(subIdea, dimensionProvider, margin);
				result.ideas[subIdeaRank] = subIdeaDimensions;
				leftOrRight = subIdeaRank > 0 ? 1 : 0;
				subIdeaWidths[leftOrRight] = Math.max(subIdeaWidths[leftOrRight], subIdeaDimensions.Width);
				subIdeaHeights[leftOrRight] += subIdeaDimensions.Height;
			}
		}
		result.WidthLeft = subIdeaWidths[0] || 0;
		result.Width = result.width + subIdeaWidths[0] + subIdeaWidths[1];
		result.Height = Math.max(result.height, subIdeaHeights[0], subIdeaHeights[1]);
		return result;
	};
	MAPJS.calculatePositions = function calculatePositions(idea, dimensionProvider, margin, x0, y0, result, isLeftSubtree) {
		var ranks,
			subIdeaRank,
			i,
			subIdeaDimensions,
			leftOrRight,
			totalHeights = [0, 0],
			subIdeaCurrentY0 = [y0, y0];
		result = result || MAPJS.calculateDimensions(idea, dimensionProvider, margin);
		x0 += result.WidthLeft;
		result.x = x0 + margin;
		result.y = y0 + 0.5 * (result.Height - result.height) + margin;
		if (result.ideas) {
			ranks = [];
			for (subIdeaRank in result.ideas) {
				ranks.push(parseFloat(subIdeaRank));
				subIdeaDimensions = result.ideas[subIdeaRank];
				if (isLeftSubtree) {
					subIdeaRank = -subIdeaRank;
				}
				totalHeights[subIdeaRank < 0 ? 0 : 1] += subIdeaDimensions.Height;
			}
			subIdeaCurrentY0[0] += 0.5 * (result.Height - totalHeights[0]);
			subIdeaCurrentY0[1] += 0.5 * (result.Height - totalHeights[1]);
			ranks.sort(function ascending(firstRank, secondRank) {
				if (firstRank >= 0 && secondRank >= 0) {
					return secondRank - firstRank;
				} else if (firstRank < 0 && secondRank < 0) {
					return firstRank - secondRank;
				} else {
					return secondRank - firstRank;
				}
			});
			for (i = ranks.length - 1; i >= 0; i -= 1) {
				subIdeaRank = ranks[i];
				subIdeaDimensions = result.ideas[subIdeaRank];
				if (isLeftSubtree) {
					subIdeaRank = -subIdeaRank;
				}
				leftOrRight = subIdeaRank > 0 ? 1 : 0;
				calculatePositions(undefined, dimensionProvider, margin, x0 + (leftOrRight ? result.width : -subIdeaDimensions.width), subIdeaCurrentY0[leftOrRight], subIdeaDimensions, isLeftSubtree || leftOrRight === 0);
				subIdeaCurrentY0[leftOrRight] += subIdeaDimensions.Height;
			}
		}
		return result;
	};
	MAPJS.calculateLayout = function (idea, dimensionProvider, margin) {
		margin = margin || 10;
		var result = {
			nodes: {},
			connectors: {}
		},
			root = MAPJS.calculatePositions(idea, dimensionProvider, margin, 0, 0),
			calculateLayoutInner = function (positions, level) {
				var subIdeaRank, from, to;
				level = level || 1;
				result.nodes[positions.id] = {
					id: positions.id,
					x: positions.x - root.x - 0.5 * root.width + margin,
					y: positions.y - root.y - 0.5 * root.height + margin,
					width: positions.width,
					height: positions.height,
					title: positions.title,
					level: level
				};
				if (positions.ideas) {
					for (subIdeaRank in positions.ideas) {
						calculateLayoutInner(positions.ideas[subIdeaRank], level + 1);
						from = positions.id;
						to = positions.ideas[subIdeaRank].id;
						result.connectors[to] = {
							from: from,
							to: to
						};
					}
				}
			};
		calculateLayoutInner(root);
		return result;
	};
}());
/*global observable*/
/*jslint forin: true*/
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
		isInputEnabled,
		currentlySelectedIdeaId,
		parentNode = function (root, id) {
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
	this.addSubIdea = function (title) {
		idea.addSubIdea(currentlySelectedIdeaId, title || titlesToRandomlyChooseFrom[Math.floor(titlesToRandomlyChooseFrom.length * Math.random())]);
	};
	this.removeSubIdea = function () {
		var parent = parentNode(idea, currentlySelectedIdeaId);
		if (idea.removeSubIdea(currentlySelectedIdeaId)) {
			self.selectNode(parent.id);
		}
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
	(function () {
		var isRootOrRightHalf = function (id) {
				return currentLayout.nodes[id].x >= currentLayout.nodes[idea.id].x;
			},
			isRootOrLeftHalf = function (id) {
				return currentLayout.nodes[id].x <= currentLayout.nodes[idea.id].x;
			},
			currentlySelectedIdeaRank = function (parent) {
				var rank;
				for (rank in parent.ideas) {
					rank = parseFloat(rank);
					if (parent.ideas[rank].id === currentlySelectedIdeaId) {
						return rank;
					}
				}
			};
		self.selectNodeLeft = function () {
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
		self.selectNodeRight = function () {
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
		self.selectNodeUp = function () {
			var parent = parentNode(idea, currentlySelectedIdeaId), myRank, previousSiblingRank, rank, isPreviousSiblingWithNegativeRank, isPreviousSiblingWithPositiveRank;
			if (parent) {
				myRank = currentlySelectedIdeaRank(parent);
				previousSiblingRank = myRank > 0 ? -Infinity : Infinity;
				for (rank in parent.ideas) {
					rank = parseFloat(rank);
					isPreviousSiblingWithNegativeRank = myRank < 0 && rank < 0 && rank > myRank && rank < previousSiblingRank;
					isPreviousSiblingWithPositiveRank = myRank > 0 && rank > 0 && rank < myRank && rank > previousSiblingRank;
					if (isPreviousSiblingWithNegativeRank || isPreviousSiblingWithPositiveRank) {
						previousSiblingRank = rank;
					}
				}
				if (previousSiblingRank !== Infinity && previousSiblingRank !== -Infinity) {
					self.selectNode(parent.ideas[previousSiblingRank].id);
				}
			}
		};
		self.selectNodeDown = function () {
			var parent = parentNode(idea, currentlySelectedIdeaId), myRank, nextSiblingRank, rank, isNextSiblingWithNegativeRank, isNextSiblingWithPositiveRank;
			if (parent) {
				myRank = currentlySelectedIdeaRank(parent);
				nextSiblingRank = myRank > 0 ? Infinity : -Infinity;
				for (rank in parent.ideas) {
					rank = parseFloat(rank);
					isNextSiblingWithNegativeRank = myRank < 0 && rank < 0 && rank < myRank && rank > nextSiblingRank;
					isNextSiblingWithPositiveRank = myRank > 0 && rank > 0 && rank > myRank && rank < nextSiblingRank;
					if (isNextSiblingWithNegativeRank || isNextSiblingWithPositiveRank) {
						nextSiblingRank = rank;
					}
				}
				if (nextSiblingRank !== Infinity && nextSiblingRank !== -Infinity) {
					self.selectNode(parent.ideas[nextSiblingRank].id);
				}
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
				} else {
					return false;
				}
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
				} else if ((nodeBeingDragged.x === node.x || nodeBeingDragged.x + nodeBeingDragged.width === node.x + node.width) && y < node.y) {
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
/*global Kinetic*/
/*jslint nomen: true*/
(function () {
	'use strict';
	var horizontalConnector, calculateConnector;
	Kinetic.Connector = function (config) {
		this.shapeFrom = config.shapeFrom;
		this.shapeTo = config.shapeTo;
		this.shapeType = 'Connector';
		Kinetic.Shape.call(this, config);
		this._setDrawFuncs();
	};
	horizontalConnector = function (parent, child) {
		var childHorizontalOffset = parent.attrs.x < child.attrs.x ? 0.1 : 0.9,
			parentHorizontalOffset = 1 - childHorizontalOffset;
		return {
			from: {
				x: parent.attrs.x + parentHorizontalOffset * parent.getWidth(),
				y: parent.attrs.y + 0.5 * parent.getHeight()
			},
			to: {
				x: child.attrs.x + childHorizontalOffset * child.getWidth(),
				y: child.attrs.y + 0.5 * child.getHeight()
			},
			controlPointOffset: 0
		};
	};
	calculateConnector = function (parent, child, ctrl) {
		var tolerance = 10,
			childMid = child.attrs.y + child.getHeight() * 0.5,
			parentMid = parent.attrs.y + parent.getHeight() * 0.5,
			childHorizontalOffset;
		if (Math.abs(parentMid - childMid) < Math.min(child.getHeight(), parent.getHeight()) * 0.75) {
			return horizontalConnector(parent, child);
		}
		childHorizontalOffset = parent.attrs.x < child.attrs.x ? 0 : 1;
		return {
			from: {
				x: parent.attrs.x + 0.5 * parent.getWidth(),
				y: parent.attrs.y + 0.5 * parent.getHeight()
			},
			to: {
				x: child.attrs.x + childHorizontalOffset * child.getWidth(),
				y: child.attrs.y + 0.5 * child.getHeight()
			},
			controlPointOffset: 0.75
		};
	};
	Kinetic.Connector.prototype = {
		drawFunc: function (canvas) {
			var context = this.getContext(),
				shapeFrom = this.shapeFrom,
				shapeTo = this.shapeTo,
				ctrl = 0.2,
				conn = calculateConnector(shapeFrom, shapeTo, ctrl),
				offset,
				maxOffset;
			if (!conn) {
				return;
			}
			context.beginPath();
			context.moveTo(conn.from.x, conn.from.y);
			offset = conn.controlPointOffset * (conn.from.y - conn.to.y);
			maxOffset = Math.min(shapeTo.getHeight(), shapeFrom.getHeight()) * 1.5;
			offset = Math.max(-maxOffset, Math.min(maxOffset, offset));
			context.quadraticCurveTo(conn.from.x, conn.to.y - offset, conn.to.x, conn.to.y);
			canvas.stroke(this);
		}
	};
	Kinetic.Global.extend(Kinetic.Connector, Kinetic.Shape);
}());
/*global console, jQuery, Kinetic*/
/*jslint nomen: true*/
(function () {
	'use strict';
	/*shamelessly copied from http://james.padolsey.com/javascript/wordwrap-for-javascript */
	var COLUMN_WORD_WRAP_LIMIT = 25;
	function wordWrap(str, width, brk, cut) {
		brk = brk || '\n';
		width = width || 75;
		cut = cut || false;
		if (!str) {
			return str;
		}
		var regex = '.{1,' + width + '}(\\s|$)' + (cut ? '|.{' + width + '}|.+$' : '|\\S+?(\\s|$)');
		return str.match(new RegExp(regex, 'g')).join(brk);
	}
	function joinLines(string) {
		return string.replace(/\s+/g, ' ');
	}
	function breakWords(string) {
		return wordWrap(joinLines(string), COLUMN_WORD_WRAP_LIMIT, '\n', false);
	}
	Kinetic.Idea = function (config) {
		var ENTER_KEY_CODE = 13,
			ESC_KEY_CODE = 27,
			self = this,
			setStageDraggable = function (isDraggable) {
				self.getStage().setDraggable(isDraggable);
			};
		config.text = breakWords(config.text);
		this.level = config.level;
		this.isSelected = false;
		this.setStyle(config);
		config.align = 'center';
		config.shadow = {
			color: 'black',
			blur: 10,
			offset: [4, 4],
			opacity: 0.4
		};
		config.cornerRadius = 10;
		config.draggable = config.level > 1;
		config.name = 'Idea';
		Kinetic.Text.apply(this, [config]);
		this.classType = 'Idea';
		this.on('dblclick', self.fire.bind(self, ':nodeEditRequested'));
		this.on('mouseover touchstart', setStageDraggable.bind(null, false));
		this.on('mouseout touchend', setStageDraggable.bind(null, true));
		this.editNode = function () {
			//this only works for solid color nodes
			self.attrs.textFill = self.attrs.fill;
			self.getLayer().draw();
			var canvasPosition = jQuery(self.getLayer().getCanvas().getElement()).offset(),
				currentText = self.getText(),
				ideaInput,
				updateText = function (newText) {
					self.setStyle(self.attrs);
					self.getStage().draw();
					self.fire(':textChanged', {
						text: breakWords(newText || currentText)
					});
					ideaInput.remove();
				},
				onCommit = function () {
					updateText(ideaInput.val());
				};
			ideaInput = jQuery('<textarea type="text" wrap="soft" class="ideaInput"></textarea>')
				.css({
					top: canvasPosition.top + self.getAbsolutePosition().y,
					left: canvasPosition.left + self.getAbsolutePosition().x,
					width: self.getWidth(),
					height: self.getHeight()
				})
				.val(joinLines(currentText))
				.appendTo('body')
				.keydown(function (e) {
					if (e.which === ENTER_KEY_CODE) {
						onCommit();
					} else if (e.which === ESC_KEY_CODE) {
						updateText(currentText);
					}
					e.stopPropagation();
				})
				.blur(onCommit)
				.focus();
		};
	};
}());
Kinetic.Idea.prototype.setStyle = function (config) {
	'use strict';
	var isDroppable = this.isDroppable,
		isSelected = this.isSelected,
		isRoot = this.level === 1;
	config.strokeWidth = 1;
	config.padding = 8;
	config.fontSize = 10;
	config.fontFamily = 'Helvetica';
	config.lineHeight = 1.5;
	config.fontStyle = 'bold';
	if (isDroppable) {
		config.stroke = '#9F4F4F';
		config.fill = {
			start: { x: 0, y: 0 },
			end: {x: 0, y: 20 },
			colorStops: [0, '#EF6F6F', 1, '#CF4F4F']
		};
		config.textFill = '#FFFFFF';
	} else if (isSelected) {
		config.fill = '#5FBF5F';
		config.textFill = '#FFFFFF';
	} else {
		config.stroke = isRoot ? '#88F' : '#888';
		config.fill = {
			start: { x: 0, y: 0 },
			end: {x: 50, y: 100 },
			colorStops: isRoot ? [0, '#4FDFFF', 1, '#30C0FF'] : [0, '#FFFFFF', 1, '#E0E0E0']
		};
		config.textFill = isRoot ? '#FFFFFF' : '#5F5F5F';
	}
};
Kinetic.Idea.prototype.setIsSelected = function (isSelected) {
	'use strict';
	this.isSelected = isSelected;
	this.setStyle(this.attrs);
	this.getLayer().draw();
};
Kinetic.Idea.prototype.setIsDroppable = function (isDroppable) {
	'use strict';
	this.isDroppable = isDroppable;
	this.setStyle(this.attrs);
};
Kinetic.Idea.prototype.transitionToAndDontStopCurrentTransitions = function (config) {
	'use strict';
	var transition = new Kinetic.Transition(this, config),
		animation = new Kinetic.Animation();
	animation.func = transition._onEnterFrame.bind(transition);
	animation.node = this.getLayer();
	transition.onFinished = animation.stop.bind(animation);
	transition.start();
	animation.start();
};
Kinetic.Global.extend(Kinetic.Idea, Kinetic.Text);
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
		node.on(':nodeEditRequested', mapModel.editNode);
		mapModel.addEventListener('nodeEditRequested:' + n.id, node.editNode);
		nodeByIdeaId[n.id] = node;
		layer.add(node);
		node.transitionToAndDontStopCurrentTransitions({
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
			easing: (reason === 'failed' ? 'bounce-ease-out' : 'ease-in-out')
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
	(function () {
		var keyboardEventHandlers = {
			13: mapModel.addSubIdea,
			8: mapModel.removeSubIdea,
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
