/*global observable, beforeEach, content, describe, expect, it, jasmine, spyOn, MAPJS*/
describe("content aggregate", function () {
	describe("content wapper", function () {
		it("automatically assigns IDs to ideas without IDs", function () {
			var wrapped = content({title: 'My Idea'});
			expect(wrapped.id).toBe(1);
		});
		it("does not touch any IDs already assigned", function () {
			var wrapped = content({id: 22, title: 'My Idea', ideas: { 1: {id: 23, title: 'My First Subidea'}}});
			expect(wrapped.ideas[1].id).toBe(23);
		});
		it("skips over any IDs already assigned while adding new IDs", function () {
			var wrapped = content({id: 55, title: 'My Idea', ideas: { 1: {title: 'My First Subidea'}}});
			expect(wrapped.ideas[1].id).toBe(56);
		});
		it("preserves any meta data stored in JSON while wrapping", function () {
			var wrapped = content({id: 55, title: 'My Idea', ideas: { 1: {title: 'My First Subidea', meta: {new_attr: 'new_val'}}}});
			expect(wrapped.ideas[1].meta.new_attr).toBe('new_val');
		});
		it("normalises all ranks to floats to avoid selection problems with x.0", function () {
			var wrapped = content({id: 55, ideas: { '2.0': {id: 2}, 3.0: {id: 3}, '-4.0': {id: 4}}});
			expect(wrapped.ideas[2.0].id).toBe(2);
			expect(wrapped.ideas[3].id).toBe(3);
			expect(wrapped.ideas[-4].id).toBe(4);
		});
		describe("getStyle", function () {
			it("returns false if the style attribute is not defined", function () {
				var wrapped = content({});
				expect(wrapped.getStyle('xx')).toBeFalsy();
			});
			it("returns the style attribute if defined", function () {
				var wrapped = content({style: {xx: 'yellow'}});
				expect(wrapped.getStyle('xx')).toBe('yellow');
			});
		});
		describe("maxID", function () {
			it("calculates the maximum assigned ID already in the idea hierarchy", function () {
				var ideas = content({id: 22, title: 'My Idea', ideas: { 1: {id: 23, title: 'My First Subidea'}, '-1': {id: 54, title: 'Max'}}});
				expect(ideas.maxId()).toBe(54);
			});
		});
		describe("findChildRankById", function () {
			var idea = content({id: 1, title: 'I1', ideas: { 5: { id: 2, title: 'I2'}, 10: { id: 3, title: 'I3'}, 15: {id: 4, title: 'I4'}}});
			it('returns the key in the parent idea list of an idea by its id', function () {
				expect(idea.findChildRankById(2)).toEqual(5);
				expect(idea.findChildRankById(3)).toEqual(10);
				expect(idea.findChildRankById(4)).toEqual(15);
			});
			it('returns false/NaN if no such child exists', function () {
				expect(idea.findChildRankById('xxx')).toBeFalsy();
			});
		});
		describe("findParent", function () {
			var idea = content({id: 1, title: 'I1', ideas: { 5: { id: 2, title: 'I2', ideas: {8: {id: 8}}}, 10: { id: 3, title: 'I3'}, 15 : {id: 4, title: 'I4'}}});
			it('returns the parent idea by child id', function () {
				expect(idea.findParent(2)).toBe(idea);
				expect(idea.findParent(8)).toPartiallyMatch({id: 2});
			});
			it('returns false if no such child exists', function () {
				expect(idea.findParent('xxx')).toBeFalsy();
			});
			it('returns false if no parent', function () {
				expect(idea.findParent(1)).toBeFalsy();
			});
		});
		describe("findSubIdeaById", function () {
			it("returns the idea reference for a direct child matching the ID", function () {
				var idea = content({id: 1, title: 'I1', ideas: { 5: { id: 2, title: 'I2'}, 10: { id: 3, title: 'I3'}, 15 : {id: 4, title: 'I4'}}});
				expect(idea.findSubIdeaById(2).id).toBe(2);
			});
			it("returns the idea reference for any indirect child matching the ID", function () {
				var idea = content({id: 5, title: 'I0', ideas: {9: {id: 1, title: 'I1', ideas: { '-5': { id: 2, title: 'I2'}, '-10': { id: 3, title: 'I3'}, '-15': {id: 4, title: 'I4'}}}}});
				expect(idea.findSubIdeaById(2).id).toBe(2);
			});
			it("returns undefined if it matches the ID itself - to avoid false positives in parent search", function () {
				var idea = content({id: 1, title: 'I1', ideas: { 5: { id: 2, title: 'I2'}, 10: { id: 3, title: 'I3'}, 15 : {id: 4, title: 'I4'}}});
				expect(idea.findSubIdeaById(1)).toBeFalsy();
			});
			it("returns undefined if no immediate child or any indirect child matches the ID", function () {
				var idea = content({id: 1, title: 'I1', ideas: { 5: { id: 2, title: 'I2'}, 10: { id: 3, title: 'I3'}, 15 : {id: 4, title: 'I4'}}});
				expect(idea.findSubIdeaById(33)).toBeFalsy();
			});
		});
		describe("find", function () {
			it('returns an array of ideas that match a predicate, sorted by depth. It only returns ID and title', function () {
				var aggregate = content({id: 5, title: 'I0', ideas: {9: {id: 1, title: 'I1', ideas: { '-5': { id: 2, title: 'I2'}, '-10': { id: 3, title: 'I3'}, '-15': {id: 4, title: 'I4'}}}}});
				expect(aggregate.find(function (idea) { return idea.id < 3; })).toEqual([{id: 1, title: 'I1'}, {id: 2, title: 'I2'}]);
			});
			it('returns an empty array if nothing matches the predicate', function () {
				var aggregate = content({id: 5, title: 'I0', ideas: {9: {id: 1, title: 'I1', ideas: { '-5': { id: 2, title: 'I2'}, '-10': { id: 3, title: 'I3'}, '-15': {id: 4, title: 'I4'}}}}});
				expect(aggregate.find(function (idea) { return idea.id > 103; })).toEqual([]);
			});
		});
		describe("nextSiblingId", function () {
			it("returns the next sibling ID by rank within the parent", function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15: {id: 4}}});
				expect(idea.nextSiblingId(2)).toBe(3);
			});
			it("for negative ranks, looks for the next rank by absolute value", function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15': {id: 4}}});
				expect(idea.nextSiblingId(2)).toBe(3);
			});
			it("only looks within its rank group (positive/negative)", function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, 15: {id: 4}}});
				expect(idea.nextSiblingId(2)).toBe(3);
			});
			it("returns false if there is no next sibling", function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.nextSiblingId(4)).toBeFalsy();
				expect(idea.nextSiblingId(2)).toBeFalsy();
			});
			it("returns false if there is no such idea", function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.nextSiblingId(22)).toBeFalsy();
			});
			it("returns false if there are no siblings", function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}}});
				expect(idea.nextSiblingId(5)).toBeFalsy();
			});
		});
		describe("previousSiblingId", function () {
			it("returns the previous sibling ID by rank within the parent", function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.previousSiblingId(3)).toBe(2);
			});
			it("for negative ranks, looks for the previous rank by absolute value", function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}});
				expect(idea.previousSiblingId(3)).toBe(2);
			});
			it("only looks within its rank group (positive/negative)", function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.previousSiblingId(4)).toBe(3);
			});
			it("returns false if there is no previous sibling", function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.previousSiblingId(2)).toBeFalsy();
				expect(idea.previousSiblingId(3)).toBeFalsy();
			});
			it("returns false if there is no such idea", function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.previousSiblingId(22)).toBeFalsy();
			});
			it("returns false if there are no siblings", function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}}});
				expect(idea.previousSiblingId(5)).toBeFalsy();
			});
		});

	});
	describe("command processing", function () {
		describe("updateStyle", function () {
			it('should allow an attribute to be set on the aggregate', function () {
				var aggregate = content({id: 71, title: 'My Idea'}),
					result = aggregate.updateStyle(71, 'newStyle', 'newValue');
				expect(result).toBeTruthy();
				expect(aggregate.getStyle('newStyle')).toBe('newValue');
			});
			it('should allow a set style to be set on the child', function () {
				var aggregate = content({id: 1, ideas: { 5: { id: 2}}}),
					result = aggregate.updateStyle(2, 'newStyle', 'newValue');
				expect(result).toBeTruthy();
				expect(aggregate.ideas[5].getStyle('newStyle')).toBe('newValue');
			});
			it('clones style when setting to a new object to prevent stale references', function () {
				var oldStyle = {},
					aggregate = content({id: 1, style: oldStyle}),
					result = aggregate.updateStyle(1, 'newStyle', 'newValue');
				expect(oldStyle).toEqual({});
			});
			it('should remove styles which have been set to false', function () {
				var aggregate = content({id: 1, style: {keptStyle: 'oldValue', newStyle: 'value'}}),
					result = aggregate.updateStyle(1, 'newStyle', false);
				expect(result).toBeTruthy();
				expect(aggregate.style.newStyle).toBeUndefined();
				expect(aggregate.style.keptStyle).toBe('oldValue');
			});
			it('should remove styles which have been set to false - as a string', function () {
				var aggregate = content({id: 1, style: {keptStyle: 'oldValue', newStyle: 'value'}}),
					result = aggregate.updateStyle(1, 'newStyle', "false");
				expect(result).toBeTruthy();
				expect(aggregate.style.newStyle).toBeUndefined();
				expect(aggregate.style.keptStyle).toBe('oldValue');
			});
			it('should remove style hash when no styles are left in the object', function () {
				var aggregate = content({id: 1, style: {newStyle: 'value'}}),
					result = aggregate.updateStyle(1, 'newStyle', false);
				expect(result).toBeTruthy();
				expect(aggregate.style).toBeUndefined();
			});
			it("fires an event matching the method call when the style changes", function () {
				var listener = jasmine.createSpy('style_listener'),
					wrapped = content({});
				wrapped.addEventListener('changed', listener);
				wrapped.updateStyle(1, 'new', 'yellow');
				expect(listener).toHaveBeenCalledWith('updateStyle', [1, 'new', 'yellow']);
			});
			it('should fail if no such child exists', function () {
				var listener = jasmine.createSpy('style_listener'),
					aggregate = content({id: 1, ideas: { 5: { id: 2}}}),
					result;
				aggregate.addEventListener('changed', listener);
				result = aggregate.updateStyle(100, 'newStyle', 'newValue');
				expect(result).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('should fail if old style equals new one', function () {
				var listener = jasmine.createSpy('style_listener'),
					aggregate = content({id: 1, style: {'v': 'x'} }),
					result;
				aggregate.addEventListener('changed', listener);
				result = aggregate.updateStyle(1, 'v', 'x');
				expect(result).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('should fail if removing a non existent property', function () {
				var listener = jasmine.createSpy('style_listener'),
					aggregate = content({id: 1, style: {'v': 'x'} }),
					result;
				aggregate.addEventListener('changed', listener);
				result = aggregate.updateStyle(1, 'y', false);
				expect(result).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('should pop an undo function onto event stack if successful', function () {
				var aggregate = content({id: 71, style: {'newStyle': 'oldValue'}});
				aggregate.updateStyle(71, 'newStyle', 'newValue');
				aggregate.undo();
				expect(aggregate.getStyle('newStyle')).toBe('oldValue');
			});
			it('should undo style deletion if successful', function () {
				var aggregate = content({id: 71, style: {'newStyle': 'oldValue'}});
				aggregate.updateStyle(71, 'newStyle', false);
				aggregate.undo();
				expect(aggregate.getStyle('newStyle')).toBe('oldValue');
			});
		});
		describe("updateTitle", function () {
			it('changes the title of the current idea only if it matches ID in command', function () {
				var first = content({id: 71, title: 'My Idea'}),
					first_succeeded = first.updateTitle(71, 'Updated');
				expect(first_succeeded).toBeTruthy();
				expect(first.title).toBe('Updated');
			});
			it('changes the title of the current idea only if it matches ID in command even if given as a string  (DOM/_.js quirk workaround)', function () {
				var first = content({id: 71.5, title: 'My Idea'}),
					first_succeeded = first.updateTitle('71.5', 'Updated');
				expect(first_succeeded).toBeTruthy();
				expect(first.title).toBe('Updated');
			});
			it('fails if the aggregate does not contain the target ID', function () {
				var second=content({id:72,title:'Untouched'}),
					second_succeeded=second.updateTitle(71,'Updated');
				expect(second_succeeded).toBeFalsy();
				expect(second.title).toBe('Untouched');
			});
			it('propagates changes to child ideas if the ID does not match, succeeding if there is a matching child', function () {
				var ideas = content({id: 1, title:'My Idea',
					ideas: {  1: {id:2, title:'My First Subidea', ideas:{1:{id:3, title:'My First sub-sub-idea'}}}}}),
					result=ideas.updateTitle(3,'Updated');
				expect(result).toBeTruthy();
				expect(ideas.ideas[1].ideas[1].title).toBe('Updated');
				expect(ideas.updateTitle('Non Existing','XX')).toBeFalsy();
			});
			it("fires an event matching the method call when the title changes", function () {
				var listener = jasmine.createSpy('title_listener'),
					wrapped = content({title:'My Idea', id:2, ideas: { 1: {id: 1, title:'Old title'}}});
				wrapped.addEventListener('changed', listener);
				wrapped.updateTitle(1, 'New Title');
				expect(listener).toHaveBeenCalledWith('updateTitle', [1,'New Title']);
			});
			it("puts a undo method on the stack when successful", function () {
				var wrapped = content({id: 71, title: 'My Idea'});
				wrapped.updateTitle(71, 'Updated');
				wrapped.undo();
				expect(wrapped.title).toBe('My Idea');
			});
		});
		describe("insertIntermediate", function () {
			var listener, idea;
			beforeEach(function () {
				idea = content({id: 1, ideas: { 77: {id:2, title:'Moved'}}});
				listener = jasmine.createSpy('insert_listener');
				idea.addEventListener('changed', listener);
			});
			it('adds an idea between the argument idea and its parent, keeping the same rank for the new node and reassigning rank of 1 to the argument', function () {
				var result=idea.insertIntermediate(2,'Steve');
				expect(result).toBeTruthy();
				expect(idea.ideas[77]).toPartiallyMatch({id:3, title:'Steve'});
				expect(_.size(idea.ideas)).toBe(1);
				expect(_.size(idea.ideas[77].ideas)).toBe(1);
				expect(idea.ideas[77].ideas[1]).toPartiallyMatch({id:2, title:'Moved'});
			});
			it('assigns an ID automatically if not provided', function () {
				var result=idea.insertIntermediate(2,'Steve');
				expect(result).toBeTruthy();
				expect(idea.ideas[77].id).not.toBeNull();
			});
			it('fires an event matching the method call when the operation succeeds', function () {
				var result=idea.insertIntermediate(2,'Steve');
				expect(listener).toHaveBeenCalledWith('insertIntermediate', [2,'Steve',3]);
			});
			it('fires the generated ID in the event if the ID was not supplied', function () {
				var result=idea.insertIntermediate(2,'Steve');
				var newId=idea.ideas[77].id;
				expect(listener).toHaveBeenCalledWith('insertIntermediate', [2,'Steve',newId]);
			});
			it('fails if argument idea does not exist', function () {
				expect(idea.insertIntermediate(22,'Steve')).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('fails if idea has no parent', function () {
				expect(idea.insertIntermediate(1,'Steve')).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('pops an event to undo stack if successful', function () {
				idea.insertIntermediate(2,'Steve');
				idea.undo();
				expect(idea.ideas[77]).toPartiallyMatch({id:2, title:'Moved'});
			});
		});
		describe("addSubIdea", function () {
			it('adds a sub-idea to the idea in the argument', function () {
				var idea = content({id:71,title:'My Idea'});
				var succeeded=idea.addSubIdea(71,'New idea');
				expect(succeeded).toBeTruthy();
				var asArray=_.toArray(idea.ideas);
				expect(asArray.length).toBe(1);
				expect(asArray[0].title).toBe('New idea');
			});
			it('repeatedly adds only one idea (bug resurrection check)', function () {
				var idea = content({id:71,title:'My Idea'});
				idea.addSubIdea(71,'First idea');
				idea.addSubIdea(71,'Second idea');
				var asArray=_.toArray(idea.ideas);
				expect(asArray.length).toBe(2);
			});
			it('assigns the next available ID to the new idea if the ID was not provided', function () {
				var idea = content({id:71,title:'My Idea'});
				idea.addSubIdea(71);
				expect(_.toArray(idea.ideas)[0].id).toBe(72);
			});
			it('assigns the first subidea the rank of 1', function () {
				var idea = content({id:71,title:'My Idea'});
				idea.addSubIdea(71);
				expect(idea.findChildRankById(72)).toBe(1);
			});
			it('when adding nodes to 2nd level items and more, adds a node at a rank greater than any of its siblings', function () {
				var idea = content({id: 1, ideas: { 1: {id:5, ideas:{ 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}}}});
				idea.addSubIdea(5,'x');
				var new_key=idea.ideas[1].findChildRankById(6);
				expect(new_key).not.toBeLessThan(15);
			});
			it('propagates to children if it does not match the requested id, succeeding if any child ID matches', function () {
				var ideas = content({id: 1, title:'My Idea',
					ideas: {  1: {id:2, title:'My First Subidea', ideas:{1:{id:3, title:'My First sub-sub-idea'}}}}});
				var result=ideas.addSubIdea(3,'New New');
				expect(result).toBeTruthy();
				expect(ideas.ideas[1].ideas[1].ideas[1].title).toBe('New New');
			});
			it('fails if no child ID in hierarchy matches requested id', function () {
				var ideas = content({id: 1, title:'My Idea',
					ideas: {  1: {id:2, title:'My First Subidea', ideas:{1:{id:3, title:'My First sub-sub-idea'}}}}});
				expect(ideas.addSubIdea(33,'New New')).toBeFalsy();
			});
			it('fires an event matching the method call when a new idea is added', function () {
				var idea = content({id:71,title:'My Idea'});
				var addedListener=jasmine.createSpy();
				idea.addEventListener('changed', addedListener);
				idea.addSubIdea(71,'New Title');
				expect(addedListener).toHaveBeenCalledWith('addSubIdea', [71,'New Title',72]);
			});
			it('pops an event on the undo stack if successful', function () {
				var idea = content({id:4, ideas:{ 1:{id:5, title:'My Idea'}}});
				idea.addSubIdea(4,'New');
				idea.undo();
				expect(idea.ideas[1]).toPartiallyMatch({id:5, title: 'My Idea'});
				expect(_.size(idea.ideas)).toBe(1);
			});
			it('takes negative rank items as absolute while calculating new rank ID (bug resurrection test)', function () {
				var idea = content({id: 1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 6: { id:3, title:'I3'}, '-16' : {id:4, title:'I4'}}});
				idea.addSubIdea(1);
				var new_key=idea.findChildRankById(5);
				expect(Math.abs(new_key)).not.toBeLessThan(16);
			});
			describe('balances positive/negative ranks when adding to aggegate root', function () {
				it('gives first child a positive rank', function () {
					var idea = content({id:1});
					idea.addSubIdea(1,'new');
					expect(idea.findChildRankById(2)).not.toBeLessThan(0);
				});
				it('gives second child a negative rank', function () {
					var idea = content({id:1});
					idea.addSubIdea(1,'new');
					idea.addSubIdea(1,'new');
					expect(idea.findChildRankById(3)).toBeLessThan(0);
				});
				it('adds a negative rank if there are more positive ranks than negative', function () {
					var idea = content({id: 1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}});
					idea.addSubIdea(1);
					expect(idea.findChildRankById(5)).toBeLessThan(0);
				});
				it('adds a positive rank if there are less or equal positive ranks than negative', function () {
					var idea = content({id: 1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, '-15' : {id:4, title:'I4'}}});
					idea.addSubIdea(1);
					expect(idea.findChildRankById(5)).not.toBeLessThan(0);
				});
				it('when adding positive rank nodes, adds a node at a rank greater than any of its siblings', function () {
					var idea = content({id: 1, ideas: { '-3': {id:5}, '-5': { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
					idea.addSubIdea(1,'x');
					var new_key=idea.findChildRankById(6);
					expect(new_key).not.toBeLessThan(15);
				});
				it('when adding negative rank nodes, adds a node at a rank lesser than any of its siblings', function () {
					var idea = content({id: 1, ideas: { '-3': {id:5}, '-5': { id: 2}, 10: { id: 3}, 15 : {id: 4}, 20 : {id:6}}});
					idea.addSubIdea(1,'x');
					var new_key=idea.findChildRankById(7);
					expect(new_key).toBeLessThan(-5);
				});
			});
		});
		describe("changeParent", function () {
			var idea;
			beforeEach(function () {
				idea = content({id:5,title:'I0',ideas:{9:{id: 1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
			});
			it("removes an idea from it's parent and reassings to another parent", function () {
				var result=idea.changeParent(4,5);
				expect(result).toBeTruthy();
				expect(idea.containsDirectChild(4)).toBeTruthy();
				expect(idea.ideas[9].containsDirectChild(4)).toBeFalsy();
			});
			it("fails if no such idea exists to remove", function () {
				expect(idea.changeParent(14,5)).toBeFalsy();
			});
			it("fails if no such new parent exists", function () {
				expect(idea.changeParent(4,11)).toBeFalsy();
				expect(idea.ideas[9].ideas[-15].id).toBe(4);
			});
			it("fires an event matching the method call when a parent is changed", function () {
				var listener = jasmine.createSpy('changeParent');
				idea.addEventListener('changed',listener);
				var result=idea.changeParent(4,5);
				expect(listener).toHaveBeenCalledWith('changeParent', [4,5]);
			});
			it("fails if asked to make a idea it's own parent", function () {
				expect(idea.changeParent(2,2)).toBeFalsy();
			});
			it("fails if asked to make a cycle (make a idea a child of it's own child)", function () {
				expect(idea.changeParent(1,2)).toBeFalsy();
			});
			it("fails if asked to put an idea in it's current parent", function () {
				expect(idea.changeParent(1,5)).toBeFalsy();
			});
			it("pops an operation to the undo stack if it succeeds", function () {
				idea.changeParent(4,5);
				idea.undo();
				expect(idea.containsDirectChild(4)).toBeFalsy();
				expect(idea.ideas[9].containsDirectChild(4)).toBeTruthy();
			});
		});
		describe("removeSubIdea", function () {
			it('removes a child idea matching the provided id', function () {
				var idea = content({id: 1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
				expect(idea.removeSubIdea(2)).toBeTruthy();
				expect(_.size(idea.ideas)).toBe(2);
				expect(idea.ideas[10].id).toBe(3);
				expect(idea.ideas[15].id).toBe(4);
			});
			it('delegates to children if no immediate child matches id', function () {
				var idea = content({id:0,title:'I0',ideas:{9:{id: 1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
				expect(idea.removeSubIdea(3)).toBeTruthy();
				expect(_.size(idea.ideas[9].ideas)).toBe(2);
				expect(idea.ideas[9].ideas[-5].id).toBe(2);
				expect(idea.ideas[9].ideas[-15].id).toBe(4);
			});
			it('fails if no immediate child matches id', function () {
				var idea = content({id:0,title:'I0',ideas:{9:{id: 1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
				expect(idea.removeSubIdea(13)).toBeFalsy();
			});
			it('fires an event matching the method call if successful', function () {
				var idea = content({id: 1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
				var addedListener=jasmine.createSpy('Idea_Added');
				idea.addEventListener('changed', addedListener);
				idea.removeSubIdea(3);
				expect(addedListener).toHaveBeenCalledWith('removeSubIdea',[3]);
			});
			it('pops an event to undo stack if successful', function () {
				var idea = content({id: 1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
				idea.removeSubIdea(2);
				idea.undo();
				expect(idea.ideas[5]).toPartiallyMatch({id: 2, title: 'I2' });
			});
		});
		describe("flip", function () {
			it('assigns the idea the largest positive rank if the current rank was negative', function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				var result=idea.flip(2);
				expect(result).toBeTruthy();
				expect(idea.ideas[10].id).toBe(3);
				expect(idea.ideas[15].id).toBe(4);
				var new_key=idea.findChildRankById(2);
				expect(new_key).not.toBeLessThan(15);
			});
			it('assigns the idea the smallest negative rank if the current rank was positive', function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				var result=idea.flip(3);
				expect(result).toBeTruthy();
				expect(idea.ideas['-5'].id).toBe(2);
				expect(idea.ideas[15].id).toBe(4);
				var new_key=idea.findChildRankById(3);
				expect(new_key).toBeLessThan(-5);
			});
			it('fails if called on idea that was not a child of the aggregate root', function () {
				var idea = content({id:0,ideas:{9:{id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}}}});
				spyOn(idea,'dispatchEvent');
				expect(idea.flip(2)).toBeFalsy();
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('fails if called on non-existing idea that was not a child of the aggregate root', function () {
				var idea = content({id:0,ideas:{9:{id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}}}});
				spyOn(idea,'dispatchEvent');
				expect(idea.flip(99)).toBeFalsy();
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('fires a flip event with arguments matching function call if successful', function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				spyOn(idea,'dispatchEvent');
				idea.flip(2);
				expect(idea.dispatchEvent).toHaveBeenCalledWith('changed','flip',[2]);
			});
			it('stores an undo function on the event stack', function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}}}), newRank;
				idea.flip(2);
				newRank=idea.findChildRankById(2);
				idea.undo();
				expect(idea.findChildRankById(2)).toBe(-5);
				expect(idea.ideas[newRank]).toBeUndefined();
			});
		});
		describe("positionBefore", function () {
			it('prevents a node to be reordered into itself, if is it already in the right position (production bugcheck)', function () {
				idea = content({id: 1,ideas:{"1":{id:2},"2":{id: 4},"3":{id:6},"4":{id:8},"-1":{id: 3},"-2":{id:5},"-3":{id:7},"-4":{id:9}}});
				expect(idea.positionBefore(5,7)).toBeFalsy();
				expect(_.size(idea.ideas)).toBe(8);
			});
			it('ignores different sign ranks when ordering', function () {
				var idea = content({id: 1, ideas:{'-0.25':{id:24}, '-10.25':{id:32}, '0.0625':{id:5}, '0.03125':{id:6}, '1.0625':{id:7}}})
				spyOn(idea,'dispatchEvent');
			expect(idea.positionBefore(24,32)).toBeFalsy();
			expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('reorders immediate children by changing the rank of an idea to be immediately before the provided idea', function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				var result=idea.positionBefore(4,3);
				expect(result).toBeTruthy();
				expect(idea.ideas[5].id).toBe(2);
				expect(idea.ideas[10].id).toBe(3);
				var new_key=idea.findChildRankById(4);
				expect(new_key).toBeLessThan(10);
				expect(new_key).not.toBeLessThan(5);
			});
			it('fails if the idea should be ordered before itself', function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 12: { id: 3}, 15 : {id: 4}}});
				spyOn(idea,'dispatchEvent');
				var result=idea.positionBefore(3,3);
				expect(result).toBeFalsy();
				expect(idea.ideas[5].id).toBe(2);
				expect(idea.ideas[12].id).toBe(3);
				expect(idea.ideas[15].id).toBe(4);
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('fails if the idea should be ordered in the same place', function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 12: { id: 3}, 15 : {id: 4}}});
				spyOn(idea,'dispatchEvent');
				var result=idea.positionBefore(3,4);
				expect(result).toBeFalsy();
				expect(idea.ideas[5].id).toBe(2);
				expect(idea.ideas[12].id).toBe(3);
				expect(idea.ideas[15].id).toBe(4);
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('fails if it cannot find appropriate idea to reorder', function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				var result=idea.positionBefore(12,3);
				expect(result).toBeFalsy();
			});
			it('fails if idea should be ordered before non-sibling', function() {
				var idea = content({
					id: 1,
					ideas: {
						5: {
							id: 2,
							ideas: {
								5: {
									id: 3
								},
								10: {
									id: 4
								}
							}
						},
						10: {
							id: 5,
							ideas: {
								5: {
									id: 6
								},
								10: {
									id: 7
								}
							}
						}
					}
				});
				spyOn(idea,'dispatchEvent');
				var result = idea.positionBefore(6, 3);
				expect(result).toBe(false);
				expect(idea.ideas[10].ideas.NaN).not.toBeDefined();
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('orders negative ideas as negative ranks', function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}});
				var result=idea.positionBefore(4,3);
				expect(result).toBeTruthy();
				expect(idea.ideas[-5].id).toBe(2);
				expect(idea.ideas[-10].id).toBe(3);
				var new_key=idea.findChildRankById(4);
				expect(new_key).not.toBeLessThan(-10);
				expect(new_key).toBeLessThan(-5);
			});
			it('puts the child in the first rank if the boundary idea was the first', function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				var result=idea.positionBefore(4,2);
				expect(result).toBeTruthy();
				expect(idea.ideas[5].id).toBe(2);
				expect(idea.ideas[10].id).toBe(3);
				var new_key=idea.findChildRankById(4);
				expect(new_key).toBeLessThan(5);
			});
			it('gives the idea the largest positive rank if the boundary idea was not defined and current rank was positive', function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				var result=idea.positionBefore(2);
				expect(result).toBeTruthy();
				expect(idea.ideas[10].id).toBe(3);
				expect(idea.ideas[15].id).toBe(4);
				var new_key=idea.findChildRankById(2);
				expect(new_key).not.toBeLessThan(15);
			});
			it('fails if the boundary idea was not defined and child was already last', function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				spyOn(idea,'dispatchEvent');
				var result=idea.positionBefore(4);
				expect(result).toBeFalsy();
				expect(idea.ideas[5].id).toBe(2);
				expect(idea.ideas[10].id).toBe(3);
				expect(idea.ideas[15].id).toBe(4);
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('puts the child closest to zero from the - side if the boundary idea was the smallest negative', function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}});
				var result=idea.positionBefore(4,2);
				expect(result).toBeTruthy();
				expect(idea.ideas[-5].id).toBe(2);
				expect(idea.ideas[-10].id).toBe(3);
				var new_key=idea.findChildRankById(4);
				expect(new_key).not.toBeLessThan(-5);
				expect(new_key).toBeLessThan(0);
			});
			it('puts the child in the last negative rank if the boundary idea was not defined but current rank is negative', function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}});
				var result=idea.positionBefore(2);
				expect(result).toBeTruthy();
				expect(idea.ideas[-10].id).toBe(3);
				expect(idea.ideas[-15].id).toBe(4);
				var new_key=idea.findChildRankById(2);
				expect(new_key).toBeLessThan(-15);
			});
			it('fails if the boundary idea was not defined and child was already last with negative ranks', function () {
				var idea = content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}});
				spyOn(idea,'dispatchEvent');
				var result=idea.positionBefore(4);
				expect(result).toBeFalsy();
				expect(idea.ideas[-5].id).toBe(2);
				expect(idea.ideas[-10].id).toBe(3);
				expect(idea.ideas[-15].id).toBe(4);
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('fails if the boundary idea was not defined and child was already last in its group (positive/negative)', function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 8:{id:5}, '-10': { id: 3}, '-15' : {id: 4}}});
				spyOn(idea,'dispatchEvent');
				expect(idea.positionBefore(4)).toBeFalsy();
				expect(idea.positionBefore(5)).toBeFalsy();
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('delegates to children if it does not contain the requested idea, succeeding if any child does', function () {
				var idea = content({id:0,title:'I0',ideas:{9:{id: 1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
				var result=idea.positionBefore(4,2);
				expect(result).toBeTruthy();
				var child=idea.ideas[9];
				expect(child.ideas[-5].id).toBe(2);
				expect(child.ideas[-10].id).toBe(3);
				var new_key=child.findChildRankById(4);
				expect(new_key).toBeLessThan(10);
				expect(new_key).not.toBeLessThan(-5);
				expect(new_key).toBeLessThan(0);
			});
			it('fails if none of the children contain the requested idea either', function () {
				var idea = content({id:0,title:'I0',ideas:{9:{id: 1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
				var result=idea.positionBefore(-4, 2);
				expect(result).toBeFalsy();
			});
			it('fires an event matching the method call if it succeeds', function () {
				var idea = content({id:0,title:'I0',ideas:{9:{id: 1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
				childRankSpy=jasmine.createSpy('ChildRankListener');
				idea.addEventListener('changed', childRankSpy);
				var result=idea.positionBefore(4,2);
				expect(childRankSpy).toHaveBeenCalledWith('positionBefore',[4,2]);
			});
			it('should work for negative ranks', function () {
				var idea = content({
					"title": "1",
					"id": 1,
					"ideas": {
						"-3": {
							"title": "4",
							"id": 4
						},
						"-2": {
							"title": "3",
							"id": 3
						},
						"-1": {
							"title": "2",
							"id": 2
						}
					}
				});
				expect(idea.positionBefore(2, 4)).toBe(true);
			});
			it('pops an undo function onto the event stack if successful', function () {
				var idea = content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}}),
					newKey;
				idea.positionBefore(4,3);
				newKey=idea.findChildRankById(4);
				idea.undo();
				expect(idea.ideas[15].id).toBe(4);
				expect(idea.ideas[newKey]).toBeUndefined();
				expect(_.size(idea.ideas)).toBe(3);
			});
		});
	});
	describe ("undo", function () {
		it("succeeds if there is something to undo", function () {
			var wrapped = content({id: 1, title: 'Original'});
			wrapped.updateTitle(1, 'First');
			expect(wrapped.undo()).toBeTruthy();
		});
		it("multiple changes stack on the undo stack in the order of recency", function () {
			var wrapped = content({id: 1, title: 'Original'});
			wrapped.updateTitle(1, 'First');
			wrapped.updateTitle(1, 'Second');
			wrapped.undo();
			wrapped.undo();
			expect(wrapped.title).toBe('Original');
		});
		it("fires a change event if it succeeds", function () {
			var wrapped = content({id: 1, title: 'Original'}),
				spy = jasmine.createSpy('change');
			wrapped.updateTitle(1, 'First');
			wrapped.addEventListener('changed', spy);
			wrapped.undo();
			expect(spy).toHaveBeenCalledWith('undo',[]);
		});
		it("fails if there is nothing to undo", function () {
			var wrapped = content({id: 1, title: 'Original'}),
				spy = jasmine.createSpy('change');
			wrapped.addEventListener('changed', spy);
			expect(wrapped.undo()).toBeFalsy();
			expect(spy).not.toHaveBeenCalled();
		});
	});
});
