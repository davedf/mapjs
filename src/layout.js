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
		result.Width = result.width + subIdeaWidths[0] + subIdeaWidths[1];
		result.Height = Math.max(result.height, subIdeaHeights[0], subIdeaHeights[1]);
		return result;
	};
	MAPJS.calculatePositions = function calculatePositions(idea, dimensionProvider, margin, x0, y0) {
		var result = arguments[5] || MAPJS.calculateDimensions(idea, dimensionProvider, margin),
			isLeftSubtree = arguments[6],
			ranks,
			subIdeaRank,
			i,
			subIdeaDimensions,
			leftOrRight,
			subIdeaCurrentY0 = [y0, y0];
		result.x = x0 + margin;
		result.y = y0 + 0.5 * (result.Height - result.height) + margin;
		if (result.ideas) {
			ranks = [];
			for (subIdeaRank in result.ideas) {
				ranks.push(parseFloat(subIdeaRank));
			}
			ranks.sort(function ascending(firstRank, secondRank) { return secondRank - firstRank; });
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
	MAPJS.calculateLayout = function (idea, dimensionProvider) {
		var result = {
			nodes: {},
			connectors: []
		},
			calculateLayoutInner = function (positions) {
				var subIdeaRank;
				result.nodes[positions.id] = {
					x: positions.x,
					y: positions.y,
					title: positions.title
				};
				if (positions.ideas) {
					for (subIdeaRank in positions.ideas) {
						calculateLayoutInner(positions.ideas[subIdeaRank]);
						result.connectors.push({
							from: positions.id,
							to: positions.ideas[subIdeaRank].id
						});
					}
				}
			};
		calculateLayoutInner(MAPJS.calculatePositions(idea, dimensionProvider, 10, 0, 0));
		return result;
	};
}());
MAPJS.calculateLayout2 = function calculateLayout(idea, dimensionProvider) {
	'use strict';
	var padding = 10,
		dimensions = dimensionProvider(idea.title),
		result = {
			nodes: {},
			connectors: []
		},
		currentNode = {
			offset: {
				x: -0.5 * dimensions.width,
				y: -0.5 * dimensions.height
			},
			dimensions: dimensions
		};
	result.nodes[idea.id] = currentNode;
	if (idea.ideas) {
		var firstChild = _.toArray(idea.ideas)[0],
			childResult = calculateLayout(firstChild, dimensionProvider);
		_.each(
			childResult.nodes,
			function (value, key) {
				value.offset.x = currentNode.offset.x + currentNode.dimensions.width + padding;
			}
		);
		_.extend(result.nodes, childResult.nodes);
	}
	return result;
};
