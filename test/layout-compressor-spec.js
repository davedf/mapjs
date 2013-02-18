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
				{ x : 1, y : 0, width : 6, height : 10 },
				{ x : 1.5, y : 2, width : 3.5, height : 10 },
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
	describe('layout compressor integration test', function () {
		var layout = {
			"id": 1,
			"title": "compress me, level 6",
			"width": 168,
			"height": 51,
			"ideas": {
				"31": {
					"id": 9,
					"title": "node 9.0",
					"width": 89,
					"height": 51,
					"ideas": {
						"1": {
							"id": 2,
							"title": "node 2.0",
							"width": 89,
							"height": 51,
							"ideas": {
								"1": {
									"id": 4,
									"title": "node 4.0",
									"width": 89,
									"height": 51,
									"ideas": {
										"1": {
											"id": 28,
											"title": "node 27",
											"width": 85,
											"height": 51,
											"WidthLeft": 0,
											"Width": 85,
											"Height": 51,
											"x": 700,
											"y": 61
										},
										"2": {
											"id": 29,
											"title": "node 28",
											"width": 85,
											"height": 51,
											"WidthLeft": 0,
											"Width": 85,
											"Height": 51,
											"x": 700,
											"y": 112
										},
										"3": {
											"id": 30,
											"title": "node 29",
											"width": 85,
											"height": 51,
											"WidthLeft": 0,
											"Width": 85,
											"Height": 51,
											"x": 700,
											"y": 163
										},
										"4": {
											"id": 31,
											"title": "node 30",
											"width": 85,
											"height": 51,
											"WidthLeft": 0,
											"Width": 85,
											"Height": 51,
											"x": 700,
											"y": 214
										},
										"5": {
											"id": 32,
											"title": "node 31",
											"width": 85,
											"height": 51,
											"WidthLeft": 0,
											"Width": 85,
											"Height": 51,
											"x": 700,
											"y": 265
										}
									},
									"WidthLeft": 0,
									"Width": 174,
									"Height": 255,
									"x": 611,
									"y": 163
								},
								"2": {
									"id": 5,
									"title": "node 5.0",
									"width": 89,
									"height": 51,
									"WidthLeft": 0,
									"Width": 89,
									"Height": 51,
									"x": 611,
									"y": 316
								},
								"3": {
									"id": 12,
									"title": "node 12",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 611,
									"y": 367
								}
							},
							"WidthLeft": 0,
							"Width": 263,
							"Height": 357,
							"x": 522,
							"y": 214
						},
						"2": {
							"id": 3,
							"title": "node 3.0",
							"width": 89,
							"height": 51,
							"WidthLeft": 0,
							"Width": 89,
							"Height": 51,
							"x": 522,
							"y": 418
						},
						"3": {
							"id": 6,
							"title": "node 6.0",
							"width": 89,
							"height": 51,
							"ideas": {
								"1": {
									"id": 7,
									"title": "node 7.0",
									"width": 89,
									"height": 51,
									"WidthLeft": 0,
									"Width": 89,
									"Height": 51,
									"x": 611,
									"y": 469
								},
								"2": {
									"id": 8,
									"title": "node 8.0",
									"width": 89,
									"height": 51,
									"WidthLeft": 0,
									"Width": 89,
									"Height": 51,
									"x": 611,
									"y": 520
								},
								"3": {
									"id": 13,
									"title": "node 13",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 611,
									"y": 571
								},
								"4": {
									"id": 14,
									"title": "node 14",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 611,
									"y": 622
								}
							},
							"WidthLeft": 0,
							"Width": 178,
							"Height": 204,
							"x": 522,
							"y": 545.5
						}
					},
					"WidthLeft": 0,
					"Width": 352,
					"Height": 612,
					"x": 433,
					"y": 341.5
				},
				"41": {
					"id": 11,
					"title": "node 11",
					"width": 85,
					"height": 51,
					"WidthLeft": 0,
					"Width": 85,
					"Height": 51,
					"x": 433,
					"y": 673
				},
				"7.75": {
					"id": 10,
					"title": "node 10",
					"width": 85,
					"height": 51,
					"WidthLeft": 0,
					"Width": 85,
					"Height": 51,
					"x": 433,
					"y": 10
				},
				"-1": {
					"id": 15,
					"title": "node 15",
					"width": 85,
					"height": 51,
					"ideas": {

					},
					"WidthLeft": 0,
					"Width": 85,
					"Height": 51,
					"x": 180,
					"y": 112
				},
				"-2": {
					"id": 16,
					"title": "node 16",
					"width": 85,
					"height": 51,
					"ideas": {
						"1": {
							"id": 18,
							"title": "node 17",
							"width": 85,
							"height": 51,
							"ideas": {
								"1": {
									"id": 21,
									"title": "node 20",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 163
								},
								"2": {
									"id": 22,
									"title": "node 21",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 214
								},
								"3": {
									"id": 23,
									"title": "node 22",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 265
								}
							},
							"WidthLeft": 0,
							"Width": 170,
							"Height": 153,
							"x": 95,
							"y": 214
						},
						"2": {
							"id": 19,
							"title": "node 18",
							"width": 85,
							"height": 51,
							"WidthLeft": 0,
							"Width": 85,
							"Height": 51,
							"x": 95,
							"y": 316
						},
						"3": {
							"id": 20,
							"title": "node 19",
							"width": 85,
							"height": 51,
							"ideas": {
								"1": {
									"id": 24,
									"title": "node 23",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 367
								},
								"2": {
									"id": 25,
									"title": "node 24",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 418
								},
								"3": {
									"id": 26,
									"title": "node 25",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 469
								},
								"4": {
									"id": 27,
									"title": "node 26",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 520
								}
							},
							"WidthLeft": 0,
							"Width": 170,
							"Height": 204,
							"x": 95,
							"y": 443.5
						}
					},
					"WidthLeft": 0,
					"Width": 255,
					"Height": 408,
					"x": 180,
					"y": 341.5
				},
				"-3": {
					"id": 17,
					"title": "node 17",
					"width": 85,
					"height": 51,
					"WidthLeft": 0,
					"Width": 85,
					"Height": 51,
					"x": 180,
					"y": 571
				}
			},
			"WidthLeft": 255,
			"Width": 775,
			"Height": 714,
			"x": 265,
			"y": 341.5
		},
			result;

		result = MAPJS.LayoutCompressor.compress(layout);

		expect(result).toEqual({
			"id": 1,
			"title": "compress me, level 6",
			"width": 168,
			"height": 51,
			"ideas": {
				"31": {
					"id": 9,
					"title": "node 9.0",
					"width": 89,
					"height": 51,
					"ideas": {
						"1": {
							"id": 2,
							"title": "node 2.0",
							"width": 89,
							"height": 51,
							"ideas": {
								"1": {
									"id": 4,
									"title": "node 4.0",
									"width": 89,
									"height": 51,
									"ideas": {
										"1": {
											"id": 28,
											"title": "node 27",
											"width": 85,
											"height": 51,
											"WidthLeft": 0,
											"Width": 85,
											"Height": 51,
											"x": 700,
											"y": -143
										},
										"2": {
											"id": 29,
											"title": "node 28",
											"width": 85,
											"height": 51,
											"WidthLeft": 0,
											"Width": 85,
											"Height": 51,
											"x": 700,
											"y": -92
										},
										"3": {
											"id": 30,
											"title": "node 29",
											"width": 85,
											"height": 51,
											"WidthLeft": 0,
											"Width": 85,
											"Height": 51,
											"x": 700,
											"y": -41
										},
										"4": {
											"id": 31,
											"title": "node 30",
											"width": 85,
											"height": 51,
											"WidthLeft": 0,
											"Width": 85,
											"Height": 51,
											"x": 700,
											"y": 10
										},
										"5": {
											"id": 32,
											"title": "node 31",
											"width": 85,
											"height": 51,
											"WidthLeft": 0,
											"Width": 85,
											"Height": 51,
											"x": 700,
											"y": 61
										}
									},
									"WidthLeft": 0,
									"Width": 174,
									"Height": 255,
									"x": 611,
									"y": -41
								},
								"2": {
									"id": 5,
									"title": "node 5.0",
									"width": 89,
									"height": 51,
									"WidthLeft": 0,
									"Width": 89,
									"Height": 51,
									"x": 611,
									"y": 112
								},
								"3": {
									"id": 12,
									"title": "node 12",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 611,
									"y": 163
								}
							},
							"WidthLeft": 0,
							"Width": 263,
							"Height": 357,
							"x": 522,
							"y": 61
						},
						"2": {
							"id": 3,
							"title": "node 3.0",
							"width": 89,
							"height": 51,
							"WidthLeft": 0,
							"Width": 89,
							"Height": 51,
							"x": 522,
							"y": 214
						},
						"3": {
							"id": 6,
							"title": "node 6.0",
							"width": 89,
							"height": 51,
							"ideas": {
								"1": {
									"id": 7,
									"title": "node 7.0",
									"width": 89,
									"height": 51,
									"WidthLeft": 0,
									"Width": 89,
									"Height": 51,
									"x": 611,
									"y": 265
								},
								"2": {
									"id": 8,
									"title": "node 8.0",
									"width": 89,
									"height": 51,
									"WidthLeft": 0,
									"Width": 89,
									"Height": 51,
									"x": 611,
									"y": 316
								},
								"3": {
									"id": 13,
									"title": "node 13",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 611,
									"y": 367
								},
								"4": {
									"id": 14,
									"title": "node 14",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 611,
									"y": 418
								}
							},
							"WidthLeft": 0,
							"Width": 178,
							"Height": 204,
							"x": 522,
							"y": 341.5
						}
					},
					"WidthLeft": 0,
					"Width": 352,
					"Height": 612,
					"x": 433,
					"y": 201.25
				},
				"41": {
					"id": 11,
					"title": "node 11",
					"width": 85,
					"height": 51,
					"WidthLeft": 0,
					"Width": 85,
					"Height": 51,
					"x": 433,
					"y": 392.5
				},
				"7.75": {
					"id": 10,
					"title": "node 10",
					"width": 85,
					"height": 51,
					"WidthLeft": 0,
					"Width": 85,
					"Height": 51,
					"x": 433,
					"y": 10
				},
				"-1": {
					"id": 15,
					"title": "node 15",
					"width": 85,
					"height": 51,
					"ideas": {

					},
					"WidthLeft": 0,
					"Width": 85,
					"Height": 51,
					"x": 180,
					"y": 35.5
				},
				"-2": {
					"id": 16,
					"title": "node 16",
					"width": 85,
					"height": 51,
					"ideas": {
						"1": {
							"id": 18,
							"title": "node 17",
							"width": 85,
							"height": 51,
							"ideas": {
								"1": {
									"id": 21,
									"title": "node 20",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 35.5
								},
								"2": {
									"id": 22,
									"title": "node 21",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 86.5
								},
								"3": {
									"id": 23,
									"title": "node 22",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 137.5
								}
							},
							"WidthLeft": 0,
							"Width": 170,
							"Height": 153,
							"x": 95,
							"y": 86.5
						},
						"2": {
							"id": 19,
							"title": "node 18",
							"width": 85,
							"height": 51,
							"WidthLeft": 0,
							"Width": 85,
							"Height": 51,
							"x": 95,
							"y": 188.5
						},
						"3": {
							"id": 20,
							"title": "node 19",
							"width": 85,
							"height": 51,
							"ideas": {
								"1": {
									"id": 24,
									"title": "node 23",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 239.5
								},
								"2": {
									"id": 25,
									"title": "node 24",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 290.5
								},
								"3": {
									"id": 26,
									"title": "node 25",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 341.5
								},
								"4": {
									"id": 27,
									"title": "node 26",
									"width": 85,
									"height": 51,
									"WidthLeft": 0,
									"Width": 85,
									"Height": 51,
									"x": 10,
									"y": 392.5
								}
							},
							"WidthLeft": 0,
							"Width": 170,
							"Height": 204,
							"x": 95,
							"y": 316
						}
					},
					"WidthLeft": 0,
					"Width": 255,
					"Height": 408,
					"x": 180,
					"y": 201.25
				},
				"-3": {
					"id": 17,
					"title": "node 17",
					"width": 85,
					"height": 51,
					"WidthLeft": 0,
					"Width": 85,
					"Height": 51,
					"x": 180,
					"y": 367
				}
			},
			"WidthLeft": 255,
			"Width": 775,
			"Height": 714,
			"x": 265,
			"y": 201.25
		});
	});
});
