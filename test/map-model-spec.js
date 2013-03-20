/*global _, observable, beforeEach, content, describe, expect, it, jasmine, spyOn, MAPJS*/
describe('MapModel', function () {
	'use strict';
	it('should be able to instantiate MapModel', function () {
		var layoutCalculator,
			underTest = new MAPJS.MapModel(observable({}), layoutCalculator);
		expect(underTest).not.toBeUndefined();
	});
	it('should dispatch inputEnabledChanged event when input is disabled', function () {
		var layoutCalculator,
			underTest = new MAPJS.MapModel(observable({}), layoutCalculator),
			inputEnabledChangedListener = jasmine.createSpy();
		underTest.addEventListener('inputEnabledChanged', inputEnabledChangedListener);

		underTest.setInputEnabled(false);

		expect(inputEnabledChangedListener).toHaveBeenCalledWith(false);
	});
	describe('events dispatched by MapModel when idea/layout is changed', function () {
		var underTest,
			anIdea,
			layoutBefore,
			layoutAfter;
		beforeEach(function () {
			var layoutCalculatorLayout,
				layoutCalculator = function () {
					return layoutCalculatorLayout;
				};
			layoutBefore = {
				nodes: {
					1: {
						x: 10,
						y: 20,
						title: 'This node will be removed'
					},
					2: {
						x: 50,
						y: 20,
						title: 'second'
					},
					9: {
						x: 100,
						y: 100,
						title: 'style change',
						style: {prop: 'old val'}
					}
				}
			};
			layoutAfter = {
				nodes: {
					2: {
						x: 49,
						y: 20,
						title: 'This node will be moved'
					},
					3: {
						x: 100,
						y: 200,
						title: 'This node will be created'
					},
					9: {
						x: 100,
						y: 100,
						title: 'style change',
						style: {prop: 'new val'}
					}
				}
			};
			underTest = new MAPJS.MapModel(observable({}), layoutCalculator, ['this will have all text selected'], ['this will too']);
			layoutCalculatorLayout = layoutBefore;
			anIdea = content({
				id: 4,
				title: 'this will have all text selected',
				ideas: {
					100: {
						id: 5,
						title: 'this will too'
					},
					101: {
						id: 6,
						title: 'this will have all text selected'
					}
				}
			});
			underTest.setIdea(anIdea);
			layoutCalculatorLayout = layoutAfter;
		});
		it('should dispatch nodeCreated event when a node is created because idea is changed', function () {
			var nodeCreatedListener = jasmine.createSpy();
			underTest.addEventListener('nodeCreated', nodeCreatedListener);

			anIdea.dispatchEvent('changed');

			expect(nodeCreatedListener).toHaveBeenCalledWith(layoutAfter.nodes[3]);
		});
		it('should dispatch nodeMoved event when a node is moved because idea is changed', function () {
			var nodeMovedListener = jasmine.createSpy();
			underTest.addEventListener('nodeMoved', nodeMovedListener);

			anIdea.dispatchEvent('changed');

			expect(nodeMovedListener).toHaveBeenCalledWith(layoutAfter.nodes[2]);
		});
		it('should dispatch nodeRemoved event when a node is removed because idea is changed', function () {
			var nodeRemovedListener = jasmine.createSpy();
			underTest.addEventListener('nodeRemoved', nodeRemovedListener);

			anIdea.dispatchEvent('changed');

			expect(nodeRemovedListener).toHaveBeenCalledWith(layoutBefore.nodes[1]);
		});
		it('should dispatch nodeSelectionChanged when a different node is selected', function () {
			var nodeSelectionChangedListener = jasmine.createSpy();
			underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);

			underTest.selectNode(2);

			expect(nodeSelectionChangedListener).toHaveBeenCalledWith(2, true);
		});
		it('should dispatch nodeSelectionChanged when a different node is selected', function () {
			var nodeSelectionChangedListener = jasmine.createSpy();
			underTest.selectNode(1);
			underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);

			underTest.selectNode(2);

			expect(nodeSelectionChangedListener).toHaveBeenCalledWith(1, false);
		});
		it('should dispatch nodeEditRequested when a request to edit node is made', function () {
			var nodeEditRequestedListener = jasmine.createSpy();
			underTest.addEventListener('nodeEditRequested:1', nodeEditRequestedListener);
			underTest.selectNode(1);

			underTest.editNode('toolbar', true);

			expect(nodeEditRequestedListener).toHaveBeenCalledWith(true);
		});
		it('should select all text when the current text of root node is one of our defaults', function () {
			var nodeEditRequestedListener = jasmine.createSpy();
			underTest.addEventListener('nodeEditRequested:4', nodeEditRequestedListener);
			underTest.selectNode(4);

			underTest.editNode('toolbar', false);

			expect(nodeEditRequestedListener).toHaveBeenCalledWith(true);
		});
		it('should select all text when the current text of child node is one of our defaults', function () {
			var nodeEditRequestedListener = jasmine.createSpy();
			underTest.addEventListener('nodeEditRequested:6', nodeEditRequestedListener);
			underTest.selectNode(6);

			underTest.editNode('toolbar', false);

			expect(nodeEditRequestedListener).toHaveBeenCalledWith(true);
		});
		it('should select all text when the current text of child node is one of our intermediate defaults', function () {
			var nodeEditRequestedListener = jasmine.createSpy();
			underTest.addEventListener('nodeEditRequested:5', nodeEditRequestedListener);
			underTest.selectNode(5);

			underTest.editNode('toolbar', false);

			expect(nodeEditRequestedListener).toHaveBeenCalledWith(true);
		});
		it('should dispatch nodeStyleChanged the style changes is created', function () {
			var nodeStyleChangedListener = jasmine.createSpy();
			underTest.addEventListener('nodeStyleChanged', nodeStyleChangedListener);
			anIdea.dispatchEvent('changed');
			expect(nodeStyleChangedListener).toHaveBeenCalledWith(layoutAfter.nodes[9]);
		});
		it('should dispatch nodeEditRequested when an intermediary is created', function () {
			anIdea = content({
				id: 1,
				ideas: {
					7: {
						id: 2
					}
				}
			});
			underTest.setIdea(anIdea);
			var nodeEditRequestedListener = jasmine.createSpy(), newId;
			underTest.addEventListener('nodeEditRequested:3', nodeEditRequestedListener);
			underTest.selectNode(2);
			underTest.insertIntermediate('toolbar', true);
			expect(nodeEditRequestedListener).toHaveBeenCalledWith(true);
		});
		it('should move map to keep the currently selected node in the same place while updating style (expand/collapse)', function () {
			var layoutCalculatorLayout,
				layoutCalculator = function () {
					return layoutCalculatorLayout;
				},
				underTest,
				anIdea,
				layoutBefore,
				layoutAfter,
				nodeMovedListener = jasmine.createSpy();
			layoutBefore = {
				nodes: {
					1: {
						x: 100,
						y: 200,
						title: 'First'
					},
					2: {
						x: 0,
						y: 0,
						title: 'Second'
					}
				}
			};
			layoutAfter = {
				nodes: {
					1: {
						x: 110,
						y: 220,
						title: 'First'
					},
					2: {
						x: 0,
						y: 0,
						title: 'Second'
					}
				}
			};
			layoutCalculatorLayout = layoutBefore;
			anIdea = observable({});
			underTest = new MAPJS.MapModel(observable({}), layoutCalculator);
			underTest.setIdea(anIdea);
			layoutCalculatorLayout = layoutAfter;
			underTest.addEventListener('nodeMoved', nodeMovedListener);

			anIdea.dispatchEvent('changed', 'updateStyle', [1]);

			expect(nodeMovedListener.callCount).toBe(1);
			expect(nodeMovedListener).toHaveBeenCalledWith({
				x: -10,
				y: -20,
				title: 'Second'
			});
		});
	});
	describe('methods delegating to idea', function () {
		var anIdea, underTest;
		beforeEach(function () {
			anIdea = content({
				id: 1,
				title: 'root',
				ideas: {
					10: {
						id: 2,
						title: 'child'
					}
				}
			});
			underTest = new MAPJS.MapModel(observable({}), function () {
				return {
					nodes: {2: {style: {styleprop: 'oldValue'}}}
				};
			});
			underTest.setIdea(anIdea);
		});
		it('should invoke idea.addSubIdea with currently selected idea as parentId when addSubIdea method is invoked', function () {
			spyOn(anIdea, 'addSubIdea');
			underTest.selectNode(123);

			underTest.addSubIdea();

			expect(anIdea.addSubIdea).toHaveBeenCalledWith(123, 'double click to edit');
		});
		it('should clone active idea into clipboard when copy is called', function () {
			spyOn(anIdea, 'clone').andReturn('CLONE');
			underTest.selectNode(11);
			underTest.copy('keyboard');
			expect(anIdea.clone).toHaveBeenCalledWith(11);
		});
		it('should paste clipboard into currently selected idea when paste is called', function () {
			var toPaste = {title: 'clone'};
			spyOn(anIdea, 'clone').andReturn(toPaste);
			spyOn(anIdea, 'paste');
			underTest.selectNode(11);
			underTest.copy('keyboard');
			underTest.selectNode(12);
			underTest.paste('keyboard');
			expect(anIdea.paste).toHaveBeenCalledWith(12, toPaste);
		});
		it('should invoke idea.removeSubIdea when cut/paste method is invoked', function () {
			var toPaste = {title: 'clone'};
			spyOn(anIdea, 'clone').andReturn(toPaste);
			spyOn(anIdea, 'paste');
			spyOn(anIdea, 'removeSubIdea');
			underTest.selectNode(11);
			underTest.cut('keyboard');
			underTest.selectNode(12);
			underTest.paste('keyboard');
			expect(anIdea.paste).toHaveBeenCalledWith(12, toPaste);
			expect(anIdea.removeSubIdea).toHaveBeenCalledWith(11);
		});
		it('should invoke idea.undo when undo method is invoked', function () {
			underTest.selectNode(123);
			spyOn(anIdea, 'undo');
			underTest.undo();
			expect(anIdea.undo).toHaveBeenCalled();
		});
		it('should invoke idea.moveRelative when moveRelative method is invoked', function () {
			underTest.selectNode(123);
			spyOn(anIdea, 'moveRelative');
			underTest.moveRelative('keyboard', -1);
			expect(anIdea.moveRelative).toHaveBeenCalledWith(123, -1);
		});
		it('should invoke idea.undo when undo method is invoked', function () {
			underTest.selectNode(123);
			spyOn(anIdea, 'undo');
			underTest.undo();
			expect(anIdea.undo).toHaveBeenCalled();
		});
		it('should invoke idea.redo when redo method is invoked', function () {
			underTest.selectNode(123);
			spyOn(anIdea, 'redo');
			underTest.redo();
			expect(anIdea.redo).toHaveBeenCalled();
		});
		it('should expand the node when addSubIdea is called', function () {
			underTest.selectNode(1);
			var nodeSelectionChangedListener = jasmine.createSpy();
			underTest.collapse('source', true);
			spyOn(anIdea, 'updateStyle');
			underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);
			underTest.addSubIdea();

			expect(anIdea.updateStyle).toHaveBeenCalledWith(1, 'collapsed', false);
		});
		it('should invoke idea.addSubIdea with randomly selected title when addSubIdea method is invoked', function () {
			var underTest = new MAPJS.MapModel(
				observable({}),
				function () {
					return {};
				},
				'What a beautiful idea!'.split(' ')
			);
			underTest.setIdea(anIdea);
			spyOn(anIdea, 'addSubIdea');
			spyOn(Math, 'random').andReturn(0.6);

			underTest.addSubIdea();

			expect(anIdea.addSubIdea).toHaveBeenCalledWith(1, 'beautiful');
		});
		it('should invoke idea.removeSubIdea with currently selected idea as ideaId when removeSubIdea method', function () {
			spyOn(anIdea, 'removeSubIdea');
			underTest.selectNode(321);

			underTest.removeSubIdea('toolbar');

			expect(anIdea.removeSubIdea).toHaveBeenCalledWith(321);
		});
		it('should not invoke idea.updateStyle with selected IdeaId when collapse method is invoked', function () {
			spyOn(anIdea, 'updateStyle');
			underTest.selectNode(2);

			underTest.collapse('source', true);

			expect(anIdea.updateStyle).not.toHaveBeenCalledWith(2, 'collapsed', true);
		});
		it('should invoke idea.updateStyle with selected IdeaId when collapse method is invoked', function () {
			spyOn(anIdea, 'updateStyle');
			underTest.selectNode(321);

			underTest.collapse('source', true);

			expect(anIdea.updateStyle).toHaveBeenCalledWith(321, 'collapsed', true);
		});
		it('should invoke idea.addSubIdea with a parent of a currently selected node when addSiblingIdea is invoked', function () {
			underTest.selectNode(2);
			spyOn(anIdea, 'addSubIdea');

			underTest.addSiblingIdea();

			expect(anIdea.addSubIdea).toHaveBeenCalledWith(1, 'double click to edit');
		});
		it('should invoke idea.addSubIdea with a root node if root is currently selected node when addSiblingIdea is invoked (because root has no parent)', function () {
			underTest.selectNode(1);
			spyOn(anIdea, 'addSubIdea');

			underTest.addSiblingIdea();

			expect(anIdea.addSubIdea).toHaveBeenCalledWith(1, 'double click to edit');
		});
		it('should invoke idea.updateStyle with selected ideaId and style argument when updateStyle is called', function () {
			spyOn(anIdea, 'updateStyle');
			underTest.selectNode(2);
			underTest.updateStyle('source', 'styleprop', 'styleval');
			expect(anIdea.updateStyle).toHaveBeenCalledWith(2, 'styleprop', 'styleval');
		});
		it('should not invoke idea.updateStyle with selected ideaId and style argument when updateStyle is called with same value', function () {
			spyOn(anIdea, 'updateStyle');
			underTest.selectNode(2);
			underTest.updateStyle('source', 'styleprop', 'oldValue');
			expect(anIdea.updateStyle).not.toHaveBeenCalled();
		});

		describe("insertIntermediate", function () {
			it('should invoke idea.insertIntermediate with the id of the selected node and a random title', function () {
				var underTest = new MAPJS.MapModel(
					observable({}),
					function () {
						return {};
					},
					'What a beautiful idea!'.split(' ')
				);
				underTest.setIdea(anIdea);
				spyOn(Math, 'random').andReturn(0.6);
				underTest.selectNode(2);
				spyOn(anIdea, 'insertIntermediate');
				underTest.insertIntermediate();
				expect(anIdea.insertIntermediate).toHaveBeenCalledWith(2, 'beautiful');
			});
			it('should invoke idea.insertIntermediate a random title from the intermediary array if specified', function () {
				var underTest = new MAPJS.MapModel(
					observable({}),
					function () {
						return {};
					},
					'What a beautiful idea!'.split(' '),
					'What a stupid idea!'.split(' ')
				);
				underTest.setIdea(anIdea);
				spyOn(Math, 'random').andReturn(0.6);
				underTest.selectNode(2);
				spyOn(anIdea, 'insertIntermediate');
				underTest.insertIntermediate();
				expect(anIdea.insertIntermediate).toHaveBeenCalledWith(2, 'stupid');
			});
			it('should not invoke idea.insertIntermediate when nothing is selected and a random title', function () {
				spyOn(anIdea, 'insertIntermediate');
				underTest.insertIntermediate();
				expect(anIdea.insertIntermediate).not.toHaveBeenCalled();
			});
		});
	});
	describe('map scaling and movement', function () {
		it('should dispatch mapScaleChanged event with 1.25 scale and no zoom point when scaleUp method is invoked', function () {
			var underTest = new MAPJS.MapModel(observable({})),
				mapScaleChangedListener = jasmine.createSpy();
			underTest.addEventListener('mapScaleChanged', mapScaleChangedListener);

			underTest.scaleUp('toolbar');

			expect(mapScaleChangedListener).toHaveBeenCalledWith(1.25, undefined);
		});
		it('should dispatch mapViewResetRequested when resetView is called', function () {
			var underTest = new MAPJS.MapModel(observable({})),
				mapScaleChangedListener = jasmine.createSpy();
			underTest.addEventListener('mapViewResetRequested', mapScaleChangedListener);
			underTest.resetView();
			expect(mapScaleChangedListener).toHaveBeenCalled();
		});
		it('should dispatch mapScaleChanged event with 0.8 and no zoom point when scaleDown method is invoked', function () {
			var underTest = new MAPJS.MapModel(observable({})),
				mapScaleChangedListener = jasmine.createSpy();
			underTest.addEventListener('mapScaleChanged', mapScaleChangedListener);

			underTest.scaleDown('toolbar');

			expect(mapScaleChangedListener).toHaveBeenCalledWith(0.8, undefined);
		});
		it('should dispatch mapScaleChanged event with scale arguments when scale method is invoked', function () {
			var underTest = new MAPJS.MapModel(observable({})),
				mapScaleChangedListener = jasmine.createSpy();
			underTest.addEventListener('mapScaleChanged', mapScaleChangedListener);

			underTest.scale('toolbar', 777, 'zoompoint');

			expect(mapScaleChangedListener).toHaveBeenCalledWith(777, 'zoompoint');
		});
		it('should dispatch mapMoveRequested passsing args when a move is requested', function () {
			var underTest = new MAPJS.MapModel(observable({})),
				spy = jasmine.createSpy('moveRequested');
			underTest.addEventListener('mapMoveRequested', spy);
			underTest.move('toolbar', 100, 200);
			expect(spy).toHaveBeenCalledWith(100, 200);
		});
	});
	describe('Selection', function () {
		var anIdea, underTest;
		beforeEach(function () {
			anIdea = content({
				id: 1,
				title: 'center',
				ideas: {
					'-2': {
						id: 2,
						title: 'lower left'
					},
					'-1': {
						id: 3,
						title: 'upper left'
					},
					1: {
						id: 4,
						title: 'upper right',
						ideas: {
							1: { id: 7, title: 'cousin above' }
						}
					},
					2: {
						id: 5,
						title: 'lower right',
						ideas : {
							1: { id: 6, title: 'cousin below' }
						}
					}
				}
			});
			underTest = new MAPJS.MapModel(observable({}), function () {
				return {
					nodes: {
						1: { x: 0, y: 10 },
						2: { x: -10, y: 10},
						3: { x: -10, y: -10 },
						4: { x: 10, y: 10 },
						5: { x: 10, y: 30 },
					    6: { x:	50, y: 10 },
					    7: { x:	50, y: -10 }
					}
				};
			});
			underTest.setIdea(anIdea);
		});
		it('should select the intermediate when it is inserted', function () {
			var nodeSelectionChangedListener = jasmine.createSpy(), newId;
			anIdea.addEventListener('changed', function (evt, args) {
				if (evt === 'insertIntermediate') {
					newId = args[2];
				}
			});
			underTest.selectNode(6);
			underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);
			underTest.insertIntermediate();
			expect(nodeSelectionChangedListener).toHaveBeenCalledWith(newId, true);
		});
		it('should select parent when a node is deleted', function () {
			var nodeSelectionChangedListener = jasmine.createSpy();
			underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);
			underTest.selectNode(6);
			underTest.removeSubIdea('toolbar');
			expect(nodeSelectionChangedListener).toHaveBeenCalledWith(5, true);
		});
		describe('selectNodeRight', function () {
			it('should select lowest ranking child when currently selected node is right of central node', function () {
				var nodeSelectionChangedListener = jasmine.createSpy();
				underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);

				underTest.selectNodeRight();

				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(4, true);
			});
			it('should expand and select lowest ranking child when currently selected node is collapsed and to the right of central node', function () {
				var nodeSelectionChangedListener = jasmine.createSpy();
				underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);
				underTest.collapse('source', true);

				underTest.selectNodeRight();

				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(4, true);
				expect(anIdea.getStyle('collapsed')).toBeFalsy();
			});
			it('should select parent node when currently selected node left of central node', function () {
				underTest.selectNode(3);
				var nodeSelectionChangedListener = jasmine.createSpy();
				underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);

				underTest.selectNodeRight();

				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(1, true);
			});
		});
		describe("selectNodeLeft", function () {
			it('should select lowest ranking child when currently selected node is left of central node', function () {
				var nodeSelectionChangedListener = jasmine.createSpy();
				underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);

				underTest.selectNodeLeft();

				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(3, true);
			});
			it('should expand the node and select lowest ranking child when selected node is collapsed and left of central node', function () {
				var nodeSelectionChangedListener = jasmine.createSpy();
				underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);
				underTest.collapse('source', true);

				underTest.selectNodeLeft();
				expect(anIdea.getStyle('collapsed')).toBeFalsy();

				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(3, true);
			});
			it('should select parent node currently selected node right of central node', function () {
				underTest.selectNode(5);
				var nodeSelectionChangedListener = jasmine.createSpy();
				underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);

				underTest.selectNodeLeft();

				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(1, true);
			});
		});
		describe("selectNodeUp", function () {
			it('should select sibling above', function () {
				underTest.selectNode(5);
				var nodeSelectionChangedListener = jasmine.createSpy();
				underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);

				underTest.selectNodeUp();

				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(4, true);
			});
			it('should select closest node above if no sibling', function () {
				underTest.selectNode(6);
				var nodeSelectionChangedListener = jasmine.createSpy();
				underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);
				underTest.selectNodeUp();
				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(7, true);
			});
		});
		describe("selectNodeDown", function () {
			it('should select sibling below when selectNodeDown invoked', function () {
				underTest.selectNode(4);
				var nodeSelectionChangedListener = jasmine.createSpy();
				underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);

				underTest.selectNodeDown();

				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(5, true);
			});
			it('should select closest node below if no sibling', function () {
				underTest.selectNode(7);
				var nodeSelectionChangedListener = jasmine.createSpy();
				underTest.addEventListener('nodeSelectionChanged', nodeSelectionChangedListener);
				underTest.selectNodeDown();
				expect(nodeSelectionChangedListener).toHaveBeenCalledWith(6, true);
			});
		});
	});
	describe('analytic events', function () {
		var underTest, analyticListener;
		beforeEach(function () {
			underTest = new MAPJS.MapModel(observable({}), function () {
				return {
					nodes: {
						1: { x: 0 },
						2: { x: -10 },
						3: { x: -10 },
						4: { x: 10 },
						5: { x: 10 }
					}
				};
			});
			var anIdea = content({
				id: 1,
				title: 'center',
				ideas: {
					'-2': {
						id: 2,
						title: 'lower left'
					},
					'-1': {
						id: 3,
						title: 'upper left'
					},
					1: {
						id: 4,
						title: 'upper right'
					},
					2: {
						id: 5,
						title: 'lower right',
						ideas : {
							1: {
								id: 6
							}
						}
					}
				}
			});

			underTest.setIdea(anIdea);
			analyticListener = jasmine.createSpy();
			underTest.addEventListener('analytic', analyticListener);
		});
		it('should dispatch analytic event when methods are invoked', function () {
			var methods = ['cut', 'copy', 'paste', 'redo', 'undo', 'scaleUp', 'scaleDown', 'move', 'moveRelative', 'addSubIdea',
				'addSiblingIdea', 'removeSubIdea', 'editNode', 'selectNodeLeft', 'selectNodeRight', 'selectNodeUp', 'selectNodeDown',
				'resetView'];
			_.each(methods, function (method) {
				var spy = jasmine.createSpy(method);
				underTest.addEventListener('analytic', spy);
				underTest[method]('source');
				expect(spy).toHaveBeenCalledWith('mapModel', method, 'source');
			});
		});
		it('should dispatch analytic event when collapse method is invoked', function () {
			underTest.collapse('toolbar', false);

			expect(analyticListener).toHaveBeenCalledWith('mapModel', 'collapse:false', 'toolbar');
		});
		it('should dispatch analytic event when collapse method is invoked', function () {
			underTest.updateStyle('toolbar', 'propname', 'propval');

			expect(analyticListener).toHaveBeenCalledWith('mapModel', 'updateStyle:propname', 'toolbar');
		});
		it('should dispatch analytic event when insertIntermediate method is invoked, unless there is nothing selected', function () {
			underTest.selectNode(6);

			underTest.insertIntermediate('toolbar');

			expect(analyticListener).toHaveBeenCalledWith('mapModel', 'insertIntermediate', 'toolbar');
		});
		it('should not dispatch analytic event when insertIntermediate method is invoked and nothing selected', function () {
			underTest.insertIntermediate('toolbar');

			expect(analyticListener).not.toHaveBeenCalledWith();
		});
	});
	describe("getSelectedStyle", function () {
		var anIdea = content({ id: 1, style: {'v': 'x'}, ideas : {7: {id: 2, style: {'v': 'y'}}}}),
			layoutCalculator = function () {
				return {
					nodes: {
						1: {
							style: {
								'v': 'x'
							}
						},
						2: {
							style: {
								'v': 'y'
							}
						}
					}
				};
			},
			underTest;
		beforeEach(function () {
			underTest = new MAPJS.MapModel(observable({}), layoutCalculator);
			underTest.setIdea(anIdea);
		});
		it("retrieves root node style by default", function () {
			expect(underTest.getSelectedStyle('v')).toEqual('x');
		});
		it("retrieves root node style by default", function () {
			underTest.selectNode(2);
			expect(underTest.getSelectedStyle('v')).toEqual('y');
		});
	});
});
