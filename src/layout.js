var MAPJS = MAPJS || {};
(function () {
	MAPJS.calculateDimensions = function calculateDimensions(idea, dimensionProvider, margin) {
		var result = {
				id: idea.id
			},
			subIdeasWidth = 0,
			subIdeasHeight = 0,
			dimensions = dimensionProvider(idea.title),
			subIdeaRank,
			subIdea,
			subIdeaDimensions;
		result.Width = result.width = dimensions.width + 2 * margin;
		result.Height = result.height = dimensions.height + 2 * margin;
		result.title = idea.title;
		if (idea.ideas) {
			result.ideas = {};
			for (subIdeaRank in idea.ideas) {
				subIdea = idea.ideas[subIdeaRank];
				subIdeaDimensions = calculateDimensions(subIdea, dimensionProvider, margin);
				result.ideas[subIdeaRank] = subIdeaDimensions;
				subIdeasWidth = Math.max(subIdeasWidth, subIdeaDimensions.Width);
				subIdeasHeight += subIdeaDimensions.Height;
			}
			result.Width += subIdeasWidth;
			result.Height = Math.max(result.Height, subIdeasHeight);
		}
		return result;
	};

	MAPJS.calculatePositions = function calculatePositions(idea, dimensionProvider, margin, x0, y0) {
		var result = arguments[5] || MAPJS.calculateDimensions(idea, dimensionProvider, margin),
			subIdeaRank,
			subIdeaDimensions,
			currentY0 = y0;
		result.x = x0 + margin;
		result.y = y0 + 0.5 * (result.Height - result.height) + margin;
		if (result.ideas) {
			for (subIdeaRank in result.ideas) {
				subIdeaDimensions = result.ideas[subIdeaRank];
				calculatePositions(undefined, dimensionProvider, margin, x0 + result.width, currentY0, subIdeaDimensions);
				currentY0 += subIdeaDimensions.Height;
			}
		}
		return result;
	};

	MAPJS.calculateLayout2 = function (idea, dimensionProvider) {
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
})();

MAPJS.calculateLayout = function calculateLayout(idea, dimensionProvider) {
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
