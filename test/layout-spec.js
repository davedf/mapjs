describe('layout', function () {
	var dimensionProvider = function (text) {
		length = (text || '').length + 1;
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
	beforeEach(function () {
		viewportCenter = {
			offset: { x: 0, y: 0 },
			dimensions: { width: 0, height: 0 }
		},
		this.addMatchers({
			toBeVerticallyAlignedWith: function (expected) {
				return this.actual.offset.y + 0.5 * this.actual.dimensions.height === expected.offset.y + 0.5 * expected.dimensions.height;
			},
			toBeHorizontallyAlignedWith: function (expected) {
				return this.actual.offset.x + 0.5 * this.actual.dimensions.width === expected.offset.x + 0.5 * expected.dimensions.width;
			},
			toBeRightOf: function (expected) {
				return this.actual.offset.x > expected.offset.x + expected.dimensions.width;
			},
			toPartiallyMatch: function (expected) {
				return this.env.equals_(_.pick(this.actual, _.keys(expected)), expected);
			},
			toHaveNoIntersections: function () {
				var firstId, secondId, first, second;
				nodeList = this.actual;
				for (firstId in nodeList) {
					first = nodeList[firstId];
					for (secondId in nodeList) {
						if (firstId < secondId) {
							second = nodeList[secondId];
							var intersectionWidth =
								Math.min(first.offset.x + first.dimensions.width, second.offset.x + second.dimensions.width) -
								Math.max(first.offset.x, second.offset.x);
							var intrsectionHeight =
								Math.min(first.offset.y + first.dimensions.height, second.offset.y + second.dimensions.height) -
								Math.max(first.offset.y, second.offset.y);
							if (intersectionWidth >= 0 && intrsectionHeight >= 0)
								return false;
							}
					}
				}
				return true;
			}
		});
	});
  it('should assign root node level 1', function(){
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
								id:22
							}
						}
					},
					2: {
						id:3
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
			x: 10,
			y: 10,
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
			x: 10,
			y: 15
		});
		expect(result.nodes[8]).toPartiallyMatch({
			x: 70,
			y: 10
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
			x: 10,
			y: 10
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
		expect(result.nodes[10].x).toBe(10);
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
						title: '123',
					}
				}
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[9].y).toBe(10);
		expect(result.nodes[8].y).toBe(70);
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
		console.dir(result.nodes);
		expect(result.nodes[11].y).toBe(25);
	});
	it('should compare objects partially using the partiallyMatches matcher', function () {
		expect({ x: 1, y: 2, z: 3 }).toPartiallyMatch({ x: 1, y: 2 });
		expect({ x: 1, y: 2 }).not.toPartiallyMatch({ x: 1, y: 2, t: 3 });
		expect({ x: 1, y: 2, z: 3 }).not.toPartiallyMatch({ x: 1, y: 2, t: 3 });
		expect({ x: 1, y: 2, z: 3 }).not.toPartiallyMatch({ x: 2, y: 2 });
		expect({ x: 1, y: 2, z: 3 }).not.toPartiallyMatch({ x: 1, y: 3 });
		expect({ x: 1, y: 2, z: 3 }).not.toPartiallyMatch({ x: 1, t: 2 });
	});
	it('should use toBeRightOf matcher', function () {
		expect({ offset: { x: 30} }).toBeRightOf({ offset: { x: 0 }, dimensions: { width : 10 }});
	});
});
