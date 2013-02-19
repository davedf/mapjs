/*jslint nomen: true*/
/*global _, beforeEach, content, describe, expect, it, MAPJS*/
describe('layout compressor', function () {
	'use strict';
	describe('calculating vertical distance betweeen nodes', function () {
		it('should return infinity if nodes cannot colide when moved vertically', function () {
			var firstNode = { x: 0, y: 10, width: 10, height: 10 },
				secondNode = { x: 11, y: 10, width: 10, height: 10 },
				result;

			result = MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodes(firstNode, secondNode);

			expect(result).toBe(Infinity);
		});
		it('should return the smallest vertical distance between nodes if they are above each other', function () {
			var firstNode = { x: 0, y: 10, width: 10, height: 10 },
				secondNode = { x: 9, y: 22, width: 10, height: 10 },
				result;

			result = MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodes(firstNode, secondNode);

			expect(result).toBe(2);
		});
		it('should return 0 if nodes are touching top or bottom', function () {
			var firstNode = { x: 0, y: 10, width: 10, height: 10 },
				secondNode = { x: 9, y: 20, width: 10, height: 10 },
				result;

			result = MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodes(firstNode, secondNode);

			expect(result).toBe(0);
		});
		it('should return Infinity if nodes are touching on the side', function () {
			var firstNode = { x: 0, y: 10, width: 10, height: 10 },
				secondNode = { x: 10, y: 10, width: 10, height: 10 },
				result;

			result = MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodes(firstNode, secondNode);

			expect(result).toBe(Infinity);
		});
	});
	describe('calculating vertical distance between node list', function () {
		it('should return the minimum distance between any two nodes in specified lists', function () {
			var firstNodeList = [
					{ x: 0, y: 10, width: 10, height: 10 },
					{ x: 10, y: 8, width: 10, height: 10 },
					{ x: 20, y: 12, width: 10, height: 10 }
				],
				secondNodeList = [
					{ x: -100, y: 10, width: 10, height: 10 },
					{ x: 15, y: 30, width: 10, height: 10 },
					{ x: 100, y: 12, width: 10, height: 10 }
				],
				result;

			result = MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodeLists(firstNodeList, secondNodeList);

			expect(result).toBe(8);
		});
	});
	describe('calculating node and connector collision box', function () {
		it('should return a box with origin of parent top and horizontal mid-point containing child node', function () {
			var node = { x: 200, y: 100, width: 50, height: 20 },
				parent = { x: 0, y: 0, width: 200, height: 100 },
				result;

			result = MAPJS.LayoutCompressor.nodeAndConnectorCollisionBox(node, parent);

			expect(result).toEqual({
				x: 100,
				y: 0,
				width: 150,
				height: 120
			});
		});
		it('should return a box with origin of child top left containing left half of the parent node', function () {
			var node = { x: 0, y: 0, width: 200, height: 100 },
				parent = { x: 200, y: 100, width: 50, height: 20 },
				result;

			result = MAPJS.LayoutCompressor.nodeAndConnectorCollisionBox(node, parent);

			expect(result).toEqual({
				x: 0,
				y: 0,
				width: 225,
				height: 120
			});
		});
	});
	describe('obtaining a list of collision boxes in a subtree', function () {
		it('should return a list of node/connector collision boxes in a subtree', function () {
			var layout = {
				id: 0,
				x: 0,
				y: 0,
				width: 10,
				height: 10,
				ideas: {
					1: {
						id: 1,
						x: 1,
						y: 2,
						width: 1,
						height: 1,
						ideas: {
							1: {
								id: 3,
								x: 3,
								y: 6,
								width: 3,
								height: 6
							}
						}
					},
					2: {
						id: 2,
						x: 2,
						y: 4,
						width: 2,
						height: 4
					}
				}
			},
				result;

			result = MAPJS.LayoutCompressor.getSubTreeNodeList(layout);

			expect(result).toEqual([
				{ x : 0, y : 0, width : 10, height : 10 },
				{ x : 1, y : 2, width : 1, height : 1 },
				{ x : 1, y : 0, width : 6, height : 10 },
				{ x : 3, y : 6, width : 3, height : 6 },
				{ x : 1.5, y : 2, width : 3.5, height : 10 },
				{ x : 2, y : 4, width : 2, height : 4 },
				{ x : 2, y : 0, width : 7, height : 10 }
			]);
		});
	});
	describe('moving subtree vertically', function () {
		it('should move vertically, by specified offset, all the nodes in the specified subtree', function () {
			var layout = {
				id: 0,
				x: 0,
				y: 0,
				width: 10,
				height: 10,
				ideas: {
					1: {
						id: 1,
						x: 1,
						y: 2,
						width: 1,
						height: 1,
						ideas: {
							1: {
								id: 3,
								x: 3,
								y: 6,
								width: 3,
								height: 6
							}
						}
					},
					2: {
						id: 2,
						x: 2,
						y: 4,
						width: 2,
						height: 4
					}
				}
			};

			MAPJS.LayoutCompressor.moveSubTreeVertically(layout.ideas[1], 1);

			expect(layout).toEqual({
				id : 0,
				x : 0,
				y : 0,
				width : 10,
				height : 10,
				ideas : {
					1 : {
						id : 1,
						x : 1,
						y : 3,
						width : 1,
						height : 1,
						ideas : {
							1 : {
								id : 3,
								x : 3,
								y : 7,
								width : 3,
								height : 6
							}
						}
					},
					2 : {
						id : 2,
						x : 2,
						y : 4,
						width : 2,
						height : 4
					}
				}
			});
		});
	});
});
