var MAPJS = MAPJS || {};

(function () {
	'use strict';
	MAPJS.calculateDimensions = function calculateDimensions(idea, dimensionProvider, margin) {
		var dimensions = dimensionProvider(idea.title),
			result = _.extend(_.pick(idea, ['id', 'title', 'style']), {
				width: dimensions.width + 2 * margin,
				height: dimensions.height + 2 * margin
			}),
			leftOrRight,
			subIdeaWidths = [0, 0],
			subIdeaHeights = [0, 0],
			subIdeaRank,
			subIdea,
			subIdeaDimensions;
		if (idea.ideas && !idea.getStyle('collapsed')) {
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
				}
				if (firstRank < 0 && secondRank < 0) {
					return firstRank - secondRank;
				}
				return secondRank - firstRank;
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
				result.nodes[positions.id] = _.extend(_.pick(positions, ['id', 'width', 'height', 'title', 'style']), {
					x: positions.x - root.x - 0.5 * root.width + margin,
					y: positions.y - root.y - 0.5 * root.height + margin,
					level: level
				});
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
		MAPJS.LayoutCompressor.compress(root);
		calculateLayoutInner(root, 1);
		return result;
	};
	MAPJS.calculateFrame = function (nodes, margin) {
		margin = margin || 0;
		var result = {
			top: _.min(nodes, function (node) {return node.y; }).y - margin,
			left: _.min(nodes, function (node) {return node.x; }).x - margin
		};
		result.width = margin + _.max(_.map(nodes, function (node) { return node.x + node.width; })) - result.left;
		result.height = margin + _.max(_.map(nodes, function (node) { return node.y + node.height; })) - result.top;
		return result;
	};
}());
