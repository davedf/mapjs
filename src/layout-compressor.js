/*jslint forin: true*/
/*global MAPJS*/
MAPJS.LayoutCompressor = {};
MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodes = function (firstNode, secondNode) {
	'use strict';
	var isFirstSecond, isSecondFirst, result = Infinity;
	isFirstSecond = firstNode.x + firstNode.width <= secondNode.x;
	isSecondFirst = secondNode.x + secondNode.width <= firstNode.x;
	if (!(isFirstSecond || isSecondFirst)) {
		result = firstNode.y < secondNode.y ? secondNode.y - (firstNode.y + firstNode.height) : firstNode.y - (secondNode.y + secondNode.height);
	}
	return result;
};
MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodeLists = function (firstNodeList, secondNodeList) {
	'use strict';
	var result = Infinity, i, j;
	for (i = firstNodeList.length - 1; i >= 0; i -= 1) {
		for (j = secondNodeList.length - 1; j >= 0; j -= 1) {
			result = Math.min(result, MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodes(firstNodeList[i], secondNodeList[j]));
		}
	}
	return result;
};
MAPJS.LayoutCompressor.getSubTreeNodeList = function getSubTreeNodeList(positions, result) {
	'use strict';
	var subIdeaRank;
	result = result || [];
	result.push({
		id: positions.id,
		x: positions.x,
		y: positions.y,
		width: positions.width,
		height: positions.height
	});
	for (subIdeaRank in positions.ideas) {
		getSubTreeNodeList(positions.ideas[subIdeaRank], result);
	}
	return result;
};
MAPJS.LayoutCompressor.moveSubTreeVertically = function moveSubTreeVertically(positions, delta) {
	'use strict';
	var subIdeaRank;
	positions.y += delta;
	for (subIdeaRank in positions.ideas) {
		moveSubTreeVertically(positions.ideas[subIdeaRank], delta);
	}
};
MAPJS.centerSubTrees = function (positions) {
	'use strict';
	var subIdeaRank, ranksInOrder = [], i, allLowerNodes = [], lowerSubtree, upperSubtree, verticalDistance;
	for (subIdeaRank in positions.ideas) {
		subIdeaRank = parseFloat(subIdeaRank);
		if (subIdeaRank > 0) {
			ranksInOrder.push(subIdeaRank);
		}
	}
	if (ranksInOrder.length > 2) {
		ranksInOrder.sort(function ascending(first, second) {
			return second - first;
		});
		for (i = 1; i < ranksInOrder.length - 1; i += 1) {
			lowerSubtree = positions.ideas[ranksInOrder[i - 1]];
			upperSubtree = positions.ideas[ranksInOrder[i]];
			allLowerNodes = allLowerNodes.concat(MAPJS.LayoutCompressor.getSubTreeNodeList(lowerSubtree));
			verticalDistance = MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodeLists(
				allLowerNodes,
				MAPJS.LayoutCompressor.getSubTreeNodeList(upperSubtree)
			);
			if (verticalDistance > 0 && verticalDistance < Infinity) {
				MAPJS.LayoutCompressor.moveSubTreeVertically(upperSubtree, 0.5 * verticalDistance);
			}
		}
	}
};
MAPJS.LayoutCompressor.compress = function compress(positions) {
	'use strict';
	var subIdeaRank,
		ranksInOrder = [],
		negativeRanksInOrder = [],
		middle,
		delta,
		compressOneSide = function (ranks) {
			var i,
				upperSubtree,
				lowerSubtree,
				verticalDistance,
				allUpperNodes = [];
			for (i = 0; i < ranks.length - 1; i += 1) {
				upperSubtree = positions.ideas[ranks[i]];
				lowerSubtree = positions.ideas[ranks[i + 1]];
				allUpperNodes = allUpperNodes.concat(MAPJS.LayoutCompressor.getSubTreeNodeList(upperSubtree));
				verticalDistance = MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodeLists(
					allUpperNodes,
					MAPJS.LayoutCompressor.getSubTreeNodeList(lowerSubtree)
				);
				if (verticalDistance > 0 && verticalDistance < Infinity) {
					MAPJS.LayoutCompressor.moveSubTreeVertically(lowerSubtree, -verticalDistance);
				}
			}
		};
	for (subIdeaRank in positions.ideas) {
		subIdeaRank = parseFloat(subIdeaRank);
		compress(positions.ideas[subIdeaRank]);
		(subIdeaRank >= 0 ? ranksInOrder : negativeRanksInOrder).push(subIdeaRank);
	}
	ranksInOrder.sort(function ascending(first, second) {
		return first - second;
	});
	negativeRanksInOrder.sort(function ascending(first, second) {
		return second - first;
	});
	compressOneSide(ranksInOrder);
	compressOneSide(negativeRanksInOrder);
	if (ranksInOrder.length) {
		middle = 0.5 * (positions.ideas[ranksInOrder[0]].y + positions.ideas[ranksInOrder[ranksInOrder.length - 1]].y + positions.ideas[ranksInOrder[ranksInOrder.length - 1]].height);
		delta = positions.y - middle + 0.5 * positions.height;
		ranksInOrder.forEach(function (rank) {
			MAPJS.LayoutCompressor.moveSubTreeVertically(positions.ideas[rank], delta);
		});
	}
	if (negativeRanksInOrder.length) {
		middle = 0.5 * (positions.ideas[negativeRanksInOrder[0]].y + positions.ideas[negativeRanksInOrder[negativeRanksInOrder.length - 1]].y + positions.ideas[negativeRanksInOrder[negativeRanksInOrder.length - 1]].height);
		delta = positions.y - middle + 0.5 * positions.height;
		negativeRanksInOrder.forEach(function (rank) {
			MAPJS.LayoutCompressor.moveSubTreeVertically(positions.ideas[rank], delta);
		});
	}
	MAPJS.centerSubTrees(positions);
	return positions;
};
