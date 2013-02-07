/*global _, beforeEach, content, describe, expect, it, MAPJS*/
describe('layout', function () {
	'use strict';
	var dimensionProvider = function (text) {
		var length = (text || '').length + 1;
		return {
			width: length * 20,
			height: length * 10
		};
	},
		viewportCenter;
	describe('Calculating dimensions', function () {
		it('should return two margins plus text width/height as dimensions of a single idea', function () {
			var contentAggregate = content({
					id: 7,
					title: '1'
				}),
				result = MAPJS.calculateDimensions(contentAggregate, dimensionProvider, 10);
			expect(result).toEqual({
				id: 7,
				title: '1',
				width: 60,
				height: 40,
				Width: 60,
				Height: 40,
				WidthLeft: 0
			});
		});
		it('should return (width1 + width2 + 4 * margin, max(height1, height2) + 2 * margin)', function () {
			var contentAggregate = content({
					id: 7,
					title: '1',
					ideas: {
						1: {
							id: 8,
							title: '11'
						}
					}
				}),
				result = MAPJS.calculateDimensions(contentAggregate, dimensionProvider, 10);
			expect(result).toEqual({
				id: 7,
				title: '1',
				width: 60,
				height: 40,
				Width: 140,
				Height: 50,
				WidthLeft: 0,
				ideas: {
					1: {
						id: 8,
						title: '11',
						width: 80,
						height: 50,
						Width: 80,
						Height: 50,
						WidthLeft: 0
					}
				}
			});
		});
		it('should disregard children of collapsed nodes', function () {
			var contentAggregate = content({
					id: 7,
					title: '1',
					style: { collapsed: true },
					ideas: {
						1: {
							id: 8,
							title: '11'
						}
					}
				}),
				result = MAPJS.calculateDimensions(contentAggregate, dimensionProvider, 10);
			expect(result).toPartiallyMatch({
				id: 7,
				Width: 60,
				Height: 40,
				WidthLeft: 0,
				style: {collapsed: true}
			});
		});
		it('', function () {
			var contentAggregate = content({
					id: 7,
					title: '7',
					ideas: {
						'-1': {
							id: 8,
							title: '8'
						},
						1: {
							id: 9,
							title: '9'
						}
					}
				}),
				result = MAPJS.calculateDimensions(contentAggregate, dimensionProvider, 10);
			expect(result.Width).toBe(180);
		});
	});
	describe('Calculating positions', function () {
		it('', function () {
			var contentAggregate = content({
					id: 7,
					title: '1'
				}),
				result = MAPJS.calculatePositions(contentAggregate, dimensionProvider, 10, 0, 0);
			expect(result).toEqual({
				id: 7,
				title: '1',
				x: 10,
				y: 10,
				width: 60,
				height: 40,
				Width: 60,
				Height: 40,
				WidthLeft: 0
			});
		});
		it('', function () {
			var contentAggregate = content({
					id: 7,
					title: '1',
					ideas: {
						1: {
							id: 8,
							title: '11'
						}
					}
				}),
				result = MAPJS.calculatePositions(contentAggregate, dimensionProvider, 10, 0, 0);
			expect(result).toEqual({
				id: 7,
				title: '1',
				x: 10,
				y: 15,
				width: 60,
				height: 40,
				Width: 140,
				Height: 50,
				WidthLeft: 0,
				ideas: {
					1: {
						id: 8,
						title: '11',
						x: 70,
						y: 10,
						width: 80,
						height: 50,
						Width: 80,
						Height: 50,
						WidthLeft: 0
					}
				}
			});
		});
	});
	it('should assign root node level 1', function () {
		var contentAggregate = content({ id: 7 }),
			result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[7].level).toEqual(1);
	});
	it('should assign child node levels recursively', function () {
		var contentAggregate = content({
				id: 7,
				ideas: {
					1: {
						id: 2,
						ideas: {
							1: {
								id: 22
							}
						}
					},
					2: {
						id: 3
					}
				}
			}),
			result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[7].level).toEqual(1);
		expect(result.nodes[2].level).toEqual(2);
		expect(result.nodes[22].level).toEqual(3);
		expect(result.nodes[3].level).toEqual(2);
	});
	it('should place a root node on (margin, margin)', function () {
		var contentAggregate = content({
				id: 7,
				title: 'Hello'
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[7]).toEqual({
			id: 7,
			x: -60,
			y: -30,
			width: 140,
			height: 80,
			title: 'Hello',
			level: 1
		});
	});
	it('should place root node left of its only right child', function () {
		var contentAggregate = content({
				id: 7,
				title: '1',
				ideas: {
					1: {
						id: 8,
						title: '12'
					}
				}
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[7]).toPartiallyMatch({
			x: -20,
			y: -10
		});
		expect(result.nodes[8]).toPartiallyMatch({
			x: 40,
			y: -15
		});
	});
	it('should place root node right of its only left child', function () {
		var contentAggregate = content({
				id: 7,
				title: '1',
				ideas: {
					1: {
						id: 8,
						title: '12'
					},
					'-1': {
						id: 9,
						title: '123'
					}
				}
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[9]).toPartiallyMatch({
			x: -120,
			y: -20
		});
	});
	it('should work recursively', function () {
		var contentAggregate = content({
				id: 7,
				title: '1',
				ideas: {
					1: {
						id: 8,
						title: '12'
					},
					'-1': {
						id: 9,
						title: '123',
						ideas: {
							3: {
								id: 10,
								title: '1234'
							}
						}
					}
				}
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[10].x).toBe(-240);
	});
	it('should place child nodes below each other', function () {
		var contentAggregate = content({
				id: 7,
				title: '1',
				ideas: {
					2: {
						id: 8,
						title: '12'
					},
					1: {
						id: 9,
						title: '123'
					}
				}
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[9].y).toBe(-45);
		expect(result.nodes[8].y).toBe(15);
	});
	it('should center children vertically', function () {
		var contentAggregate = content({
				id: 10,
				title: '123',
				ideas: {
					'-2': {
						id: 11,
						title: ''
					}
				}
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[11].y).toBe(-5);
	});
	it('should copy style to nodes', function () {
		var contentAggregate = content({
			title: '123',
			style: { collapsed: true }
		}),
			result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[1]).toPartiallyMatch({
			style: {collapsed: true}
		});
	});

});
describe('MAPJS.frame', function () {
	'use strict';
	it('should set origin.y to be the minimum y', function () {
		var nodes = [{x: -10, y: 5, width: 10, height: 55}, {x: 1, y: -12, width: 15, height: 30}],
			result = MAPJS.calculateFrame(nodes, 5);
		expect(result).toPartiallyMatch({top: -17, left: -15, width: 36, height: 82});
	});
});
