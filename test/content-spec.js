describe ("content aggregate", function(){

  describe ("content wapper", function(){
    it ("automatically assigns IDs to ideas without IDs", function(){
      var wrapped=content({title:'My Idea'});
      expect(wrapped.id).toBe(1);
    });
    it ("does not touch any IDs already assigned", function(){
      var wrapped=content({id:22, title:'My Idea', ideas: { 1: {id:23, title:'My First Subidea'}}});
      expect (wrapped.ideas[1].id).toBe(23);
    });
    it ("skips over any IDs already assigned while adding new IDs", function(){
      var wrapped=content({id:55, title:'My Idea', ideas: { 1: {title:'My First Subidea'}}});
      expect (wrapped.ideas[1].id).toBe(56);
    });
    describe ("maxID", function(){
      it ("calculates the maximum assigned ID already in the idea hierarchy", function(){
        var ideas=content({id:22, title:'My Idea', ideas: { 1: {id:23, title:'My First Subidea'}, '-1':{id:54,title:'Max'}}});
        expect (ideas.maxId()).toBe(54);
      });
    });
    describe ("findChildRankById", function(){
      var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
      it ('returns the key in the parent idea list of an idea by its id', function(){
        expect( idea.findChildRankById(2)).toEqual(5);
        expect( idea.findChildRankById(3)).toEqual(10);
        expect( idea.findChildRankById(4)).toEqual(15);
      });
      it ('returns false/NaN if no such child exists', function(){
        expect( idea.findChildRankById('xxx')).toBeFalsy();
      });
    });
    describe ("findSubIdeaById", function(){
      it ("returns the idea reference for a direct child matching the ID", function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        expect(idea.findSubIdeaById(2).id).toBe(2);
      });
      it ("returns the idea reference for any indirect child matching the ID", function(){
        var idea=content({id:5,title:'I0',ideas:{9:{id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}})
        expect(idea.findSubIdeaById(2).id).toBe(2);
      });
      it ("returns undefined if it matches the ID itself - to avoid false positives in parent search", function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        expect(idea.findSubIdeaById(1)).toBeFalsy();
      });
      it ("returns undefined if no immediate child or any indirect child matches the ID", function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        expect(idea.findSubIdeaById(33)).toBeFalsy();
      });
    });
    describe ("find", function(){
      it ('returns an array of ideas that match a predicate, sorted by depth. It only returns ID and title', function(){
        var aggregate=content({id:5,title:'I0',ideas:{9:{id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}})
        expect(aggregate.find(function(idea){ return idea.id<3 })).toEqual([{id:1,title:'I1'},{id:2,title:'I2'}]);
      });
      it ('returns an empty array if nothing matches the predicate', function(){
        var aggregate=content({id:5,title:'I0',ideas:{9:{id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}})
        expect(aggregate.find(function(idea){ return idea.id>103 })).toEqual([]);
      });
    });
  });
  describe ("command processing",function(){
    describe ("updateTitle", function(){
        it ('changes the title of the current idea only if it matches ID in command', function(){
          var first=content({id:71,title:'My Idea'});
          var first_succeeded=first.updateTitle(71,'Updated');
          expect(first_succeeded).toBeTruthy();
          expect(first.title).toBe('Updated');
           });
        it ('changes the title of the current idea only if it matches ID in command even if given as a string  (DOM/_.js quirk workaround)', function(){
          var first=content({id:71.5,title:'My Idea'});
          var first_succeeded=first.updateTitle("71.5",'Updated');
          expect(first_succeeded).toBeTruthy();
          expect(first.title).toBe('Updated');
           });
        it ('fails if the aggregate does not contain the target ID', function(){
          var second=content({id:72,title:'Untouched'});
          var second_succeeded=second.updateTitle(71,'Updated');
          expect(second_succeeded).toBeFalsy();
          expect(second.title).toBe('Untouched');
        });
        it ('propagates changes to child ideas if the ID does not match, succeeding if there is a matching child', function(){
          var ideas=content({id:1, title:'My Idea',
                            ideas: {  1: {id:2, title:'My First Subidea', ideas:{1:{id:3, title:'My First sub-sub-idea'}}}}});
          var result=ideas.updateTitle(3,'Updated');
          expect(result).toBeTruthy();
          expect(ideas.ideas[1].ideas[1].title).toBe('Updated');
          expect(ideas.updateTitle('Non Existing','XX')).toBeFalsy();
        });
        it ("fires an event matching the method call when the title changes", function(){
          var listener=jasmine.createSpy('title_listener');
          var wrapped=content({title:'My Idea', id:2, ideas: { 1: {id:1, title:'Old title'}}});
          wrapped.addEventListener('updateTitle', listener);
          wrapped.updateTitle(1, 'New Title');
          expect(listener).toHaveBeenCalledWith(1,'New Title');
        });
    });
    describe ("addSubIdea", function(){
        it ('adds a sub-idea to the idea in the argument', function(){
            var idea=content({id:71,title:'My Idea'});
            var succeeded=idea.addSubIdea(71,'New idea');
            expect(succeeded).toBeTruthy();
            var asArray=_.toArray(idea.ideas);
            expect(asArray.length).toBe(1);
            expect(asArray[0].title).toBe('New idea');
           });
        it ('repeatedly adds only one idea (bug resurrection check)', function(){
            var idea=content({id:71,title:'My Idea'});
            idea.addSubIdea(71,'First idea');
            idea.addSubIdea(71,'Second idea');
            var asArray=_.toArray(idea.ideas);
            expect(asArray.length).toBe(2);

        });
        it ('assigns the next available ID to the new idea if the ID was not provided', function(){
            var idea=content({id:71,title:'My Idea'});
            idea.addSubIdea(71);
            expect(_.toArray(idea.ideas)[0].id).toBe(72);
        });
        it ('assigns the next specified ID to the new idea if the ID was provided', function(){
            var idea=content({id:71,title:'My Idea'});
            idea.addSubIdea(71,'New Title',82);
            expect(_.toArray(idea.ideas)[0].id).toBe(82);
        });
        it ('fails if the specified ID already exists', function(){
            var idea=content({id:71,title:'My Idea'});
            expect(idea.addSubIdea(71,'New Title',71)).toBeFalsy();
            expect(_.size(idea.ideas)).toBe(0);
        });
        it ('assigns the first subidea the rank of 1', function(){
            var idea=content({id:71,title:'My Idea'});
            idea.addSubIdea(71);
            expect(idea.findChildRankById(72)).toBe(1);
        });
        it ('when adding nodes to 2nd level items and more, adds a node at a rank greater than any of its siblings', function(){
          var idea=content({id:1, ideas: { 1: {id:5, ideas:{ 5: { id: 2}, 10: { id:3}, 15 : {id:4}}}}});
          idea.addSubIdea(5,'x',6);
          var new_key=idea.ideas[1].findChildRankById(6);
          expect(new_key).not.toBeLessThan(15);
        });

        it ('propagates to children if it does not match the requested id, succeeding if any child ID matches', function(){
          var ideas=content({id:1, title:'My Idea',
                            ideas: {  1: {id:2, title:'My First Subidea', ideas:{1:{id:3, title:'My First sub-sub-idea'}}}}});
          var result=ideas.addSubIdea(3,'New New');
          expect(result).toBeTruthy();
          expect(ideas.ideas[1].ideas[1].ideas[1].title).toBe('New New');
        });
        it ('fails if no child ID in hierarchy matches requested id', function(){
          var ideas=content({id:1, title:'My Idea',
                            ideas: {  1: {id:2, title:'My First Subidea', ideas:{1:{id:3, title:'My First sub-sub-idea'}}}}});
          expect(ideas.addSubIdea(33,'New New')).toBeFalsy();
        });
        it ('fires an event matching the method call when a new idea is added', function(){
            var idea=content({id:71,title:'My Idea'});
            var addedListener=jasmine.createSpy('addSubIdea');
            idea.addEventListener('addSubIdea', addedListener);
            idea.addSubIdea(71,'New Title',88);
            expect(addedListener).toHaveBeenCalledWith(71,'New Title',88);
        });
        it ('takes negative rank items as absolute while calculating new rank ID (bug resurrection test)', function(){
          var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 6: { id:3, title:'I3'}, '-16' : {id:4, title:'I4'}}});
          idea.addSubIdea(1);
          var new_key=idea.findChildRankById(5);
          expect(Math.abs(new_key)).not.toBeLessThan(16);
        });
        describe ('balances positive/negative ranks when adding to aggegate root', function(){
          it ('gives first child a positive rank', function(){
            var idea=content({id:1});
            idea.addSubIdea(1,'new',2);
            expect(idea.findChildRankById(2)).not.toBeLessThan(0);
          });
          it ('gives second child a negative rank', function(){
            var idea=content({id:1});
            idea.addSubIdea(1,'new',2);
            idea.addSubIdea(1,'new',3);
            expect(idea.findChildRankById(3)).toBeLessThan(0);
          });
          it ('adds a negative rank if there are more positive ranks than negative', function(){
            var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}});
            idea.addSubIdea(1);
            expect(idea.findChildRankById(5)).toBeLessThan(0);
          });
          it ('adds a positive rank if there are less or equal positive ranks than negative', function(){
            var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, '-15' : {id:4, title:'I4'}}});
            idea.addSubIdea(1);
            expect(idea.findChildRankById(5)).not.toBeLessThan(0);
          });
          it ('when adding positive rank nodes, adds a node at a rank greater than any of its siblings', function(){
            var idea=content({id:1, ideas: { '-3': {id:5}, '-5': { id: 2}, 10: { id:3}, 15 : {id:4}}});
            idea.addSubIdea(1,'x',6);
            var new_key=idea.findChildRankById(6);
            expect(new_key).not.toBeLessThan(15);
          });
          it ('when adding negative rank nodes, adds a node at a rank lesser than any of its siblings', function(){
            var idea=content({id:1, ideas: { '-3': {id:5}, '-5': { id: 2}, 10: { id:3}, 15 : {id:4}, 20 : {id:6}}});
            idea.addSubIdea(1,'x',7);
            var new_key=idea.findChildRankById(7);
            expect(new_key).toBeLessThan(-5);
          });
        });
    });
    describe ("changeParent", function(){
      var idea;
      beforeEach(function(){
        idea=content({id:5,title:'I0',ideas:{9:{id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
      });
      it ("removes an idea from it's parent and reassings to another parent", function(){
        var result=idea.changeParent(4,5);
        expect(result).toBeTruthy();
        expect(idea.containsDirectChild(4)).toBeTruthy();
        expect (idea.ideas[9].containsDirectChild(4)).toBeFalsy();
      });
      it ("fails if no such idea exists to remove", function(){
          expect(idea.changeParent(14,5)).toBeFalsy();
      });
      it ("fails if no such new parent exists", function(){
        expect(idea.changeParent(4,11)).toBeFalsy();
        expect (idea.ideas[9].ideas[-15].id).toBe(4);
      });
      it ("fires an event matching the method call when a parent is changed", function(){
        var listener=jasmine.createSpy('changeParent');
        idea.addEventListener('changeParent',listener);
        var result=idea.changeParent(4,5);
        expect(listener).toHaveBeenCalledWith(4,5);
      });
      it ("fails if asked to make a idea it's own parent", function(){
        expect(idea.changeParent(2,2)).toBeFalsy();
      });
      it ("fails if asked to make a cycle (make a idea a child of it's own child)", function(){
        expect(idea.changeParent(1,2)).toBeFalsy();
      });
      it ("fails if asked to put an idea in it's current parent", function(){
        expect(idea.changeParent(1,5)).toBeFalsy();
      });
    });
    describe ("removeSubIdea", function(){
        it ('removes a child idea matching the provided id', function(){
          var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
          expect(idea.removeSubIdea(2)).toBeTruthy();
          expect(_.size(idea.ideas)).toBe(2);
          expect(idea.ideas[10].id).toBe(3);
          expect(idea.ideas[15].id).toBe(4);
        });
        it ('delegates to children if no immediate child matches id', function(){
          var idea=content({id:0,title:'I0',ideas:{9:{id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
          expect(idea.removeSubIdea(3)).toBeTruthy();
          expect(_.size(idea.ideas[9].ideas)).toBe(2);
          expect(idea.ideas[9].ideas[-5].id).toBe(2);
          expect(idea.ideas[9].ideas[-15].id).toBe(4);
        });
        it ('fails if no immediate child matches id', function(){
          var idea=content({id:0,title:'I0',ideas:{9:{id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
          expect(idea.removeSubIdea(13)).toBeFalsy();
        });
        it ('fires an event matching the method call if successful', function(){
          var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
          var addedListener=jasmine.createSpy('Idea_Added');
          idea.addEventListener('removeSubIdea', addedListener);
          idea.removeSubIdea(3);
          expect(addedListener).toHaveBeenCalledWith(3);
        });
    });
    describe ("flip", function(){
      it ('assigns the idea the largest positive rank if the current rank was negative', function(){
        var idea=content({id:1, ideas: { '-5': { id: 2}, 10: { id:3}, 15 : {id:4}}});
        var result=idea.flip(2);
        expect(result).toBeTruthy();
        expect(idea.ideas[10].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
        var new_key=idea.findChildRankById(2);
        expect(new_key).not.toBeLessThan(15);
      });
      it ('assigns the idea the smallest negative rank if the current rank was positive', function(){
        var idea=content({id:1, ideas: { '-5': { id: 2}, 10: { id:3}, 15 : {id:4}}});
        var result=idea.flip(3);
        expect(result).toBeTruthy();
        expect(idea.ideas['-5'].id).toBe(2);
        expect(idea.ideas[15].id).toBe(4);
        var new_key=idea.findChildRankById(3);
        expect(new_key).toBeLessThan(-5);
      });
      it ('fails if called on idea that was not a child of the aggregate root', function(){
        var idea=content({id:0,ideas:{9:{id:1, ideas: { '-5': { id: 2}, '-10': { id:3}, '-15' : {id:4}}}}});
        spyOn(idea,'dispatchEvent');
        expect(idea.flip(2)).toBeFalsy();
        expect(idea.dispatchEvent).not.toHaveBeenCalled();
      });
      it ('fails if called on non-existing idea that was not a child of the aggregate root', function(){
        var idea=content({id:0,ideas:{9:{id:1, ideas: { '-5': { id: 2}, '-10': { id:3}, '-15' : {id:4}}}}});
        spyOn(idea,'dispatchEvent');
        expect(idea.flip(99)).toBeFalsy();
        expect(idea.dispatchEvent).not.toHaveBeenCalled();
      });
      it ('fires a flip event with arguments matching function call if successful', function(){
        var idea=content({id:1, ideas: { '-5': { id: 2}, 10: { id:3}, 15 : {id:4}}});
        spyOn(idea,'dispatchEvent');
        idea.flip(2);
        expect(idea.dispatchEvent).toHaveBeenCalledWith('flip',2);
      });
    });
    describe ("positionBefore", function(){
      it ('ignores different sign ranks when ordering', function(){
        var idea=content({id:1, ideas:{'-0.25':{id:24}, '-10.25':{id:32}, '0.0625':{id:5}, '0.03125':{id:6}, '1.0625':{id:7}}})
        spyOn(idea,'dispatchEvent');
        expect(idea.positionBefore(24,32)).toBeFalsy();
        expect(idea.dispatchEvent).not.toHaveBeenCalled();
      });
      it ('reorders immediate children by changing the rank of an idea to be immediately before the provided idea', function(){
        var idea=content({id:1, ideas: { 5: { id: 2}, 10: { id:3}, 15 : {id:4}}});
        var result=idea.positionBefore(4,3);
        expect(result).toBeTruthy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[10].id).toBe(3);
        var new_key=idea.findChildRankById(4);
        expect(new_key).toBeLessThan(10);
        expect(new_key).not.toBeLessThan(5);
      });
      it ('fails if the idea should be ordered before itself', function(){
        var idea=content({id:1, ideas: { 5: { id: 2}, 12: { id:3}, 15 : {id:4}}});
        spyOn(idea,'dispatchEvent');
        var result=idea.positionBefore(3,3);
        expect(result).toBeFalsy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[12].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
        expect(idea.dispatchEvent).not.toHaveBeenCalled();
      });
      it ('fails if the idea should be ordered in the same place', function(){
        var idea=content({id:1, ideas: { 5: { id: 2}, 12: { id:3}, 15 : {id:4}}});
        spyOn(idea,'dispatchEvent');
        var result=idea.positionBefore(3,4);
        expect(result).toBeFalsy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[12].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
        expect(idea.dispatchEvent).not.toHaveBeenCalled();
      });
      it ('fails if it cannot find appropriate idea to reorder', function(){
        var idea=content({id:1, ideas: { 5: { id: 2}, 10: { id:3}, 15 : {id:4}}});
        var result=idea.positionBefore(12,3);
        expect(result).toBeFalsy();
      });
      it ('fails if idea should be ordered before non-sibling', function() {
         var idea=content({
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
      it ('orders negative ideas as negative ranks', function(){
        var idea=content({id:1, ideas: { '-5': { id: 2}, '-10': { id:3}, '-15' : {id:4}}});
        var result=idea.positionBefore(4,3);
        expect(result).toBeTruthy();
        expect(idea.ideas[-5].id).toBe(2);
        expect(idea.ideas[-10].id).toBe(3);
        var new_key=idea.findChildRankById(4);
        expect(new_key).not.toBeLessThan(-10);
        expect(new_key).toBeLessThan(-5);
      });
      it ('puts the child in the first rank if the boundary idea was the first', function(){
        var idea=content({id:1, ideas: { 5: { id: 2}, 10: { id:3}, 15 : {id:4}}});
        var result=idea.positionBefore(4,2);
        expect(result).toBeTruthy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[10].id).toBe(3);
        var new_key=idea.findChildRankById(4);
        expect(new_key).toBeLessThan(5);
      });
      it ('gives the idea the largest positive rank if the boundary idea was not defined and current rank was positive', function(){
        var idea=content({id:1, ideas: { 5: { id: 2}, 10: { id:3}, 15 : {id:4}}});
        var result=idea.positionBefore(2);
        expect(result).toBeTruthy();
        expect(idea.ideas[10].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
        var new_key=idea.findChildRankById(2);
        expect(new_key).not.toBeLessThan(15);
      });
      it ('fails if the boundary idea was not defined and child was already last', function(){
        var idea=content({id:1, ideas: { 5: { id: 2}, 10: { id:3}, 15 : {id:4}}});
        spyOn(idea,'dispatchEvent');
        var result=idea.positionBefore(4);
        expect(result).toBeFalsy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[10].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
        expect(idea.dispatchEvent).not.toHaveBeenCalled();
      });
      it ('puts the child closest to zero from the - side if the boundary idea was the smallest negative', function(){
        var idea=content({id:1, ideas: { '-5': { id: 2}, '-10': { id:3}, '-15' : {id:4}}});
        var result=idea.positionBefore(4,2);
        expect(result).toBeTruthy();
        expect(idea.ideas[-5].id).toBe(2);
        expect(idea.ideas[-10].id).toBe(3);
        var new_key=idea.findChildRankById(4);
        expect(new_key).not.toBeLessThan(-5);
        expect(new_key).toBeLessThan(0);
      });
      it ('puts the child in the last negative rank if the boundary idea was not defined but current rank is negative', function(){
        var idea=content({id:1, ideas: { '-5': { id: 2}, '-10': { id:3}, '-15' : {id:4}}});
        var result=idea.positionBefore(2);
        expect(result).toBeTruthy();
        expect(idea.ideas[-10].id).toBe(3);
        expect(idea.ideas[-15].id).toBe(4);
        var new_key=idea.findChildRankById(2);
        expect(new_key).toBeLessThan(-15);
      });
      it ('fails if the boundary idea was not defined and child was already last with negative ranks', function(){
        var idea=content({id:1, ideas: { '-5': { id: 2}, '-10': { id:3}, '-15' : {id:4}}});
        spyOn(idea,'dispatchEvent');
        var result=idea.positionBefore(4);
        expect(result).toBeFalsy();
        expect(idea.ideas[-5].id).toBe(2);
        expect(idea.ideas[-10].id).toBe(3);
        expect(idea.ideas[-15].id).toBe(4);
        expect(idea.dispatchEvent).not.toHaveBeenCalled();
      });
      it ('fails if the boundary idea was not defined and child was already last in its group (positive/negative)', function(){
        var idea=content({id:1, ideas: { 5: { id: 2}, 8:{id:5}, '-10': { id:3}, '-15' : {id:4}}});
        spyOn(idea,'dispatchEvent');
        expect(idea.positionBefore(4)).toBeFalsy();
        expect(idea.positionBefore(5)).toBeFalsy();
        expect(idea.dispatchEvent).not.toHaveBeenCalled();
      });
      it ('delegates to children if it does not contain the requested idea, succeeding if any child does', function(){
        var idea=content({id:0,title:'I0',ideas:{9:{id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
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
      it ('fails if none of the children contain the requested idea either', function(){
        var idea=content({id:0,title:'I0',ideas:{9:{id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
        var result=idea.positionBefore(-4, 2);
        expect(result).toBeFalsy();
      });
      it ('fires an event matching the method call if it succeeds', function(){
        var idea=content({id:0,title:'I0',ideas:{9:{id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
        childRankSpy=jasmine.createSpy('ChildRankListener');
        idea.addEventListener('positionBefore', childRankSpy);
        var result=idea.positionBefore(4,2);
        expect(childRankSpy).toHaveBeenCalledWith(4,2);
      });
    });
  });
  describe('clear', function () {
    var wrapped;
    beforeEach(function () {
      wrapped=content({
        title:'My Idea',
        ideas: {
          1: {
            title: 'Child idea'
          }
        }
      });
    });
    it('should preserve root node title', function () {
      wrapped.clear();

      expect(wrapped.title).toBe('My Idea');
    });
    it('should remove all the subnodes', function () {
      wrapped.clear();

      expect(wrapped.ideas).not.toBeDefined();
    });
    it('should invoke changed listeners', function () {
      changedListener = jasmine.createSpy();
      wrapped.addEventListener('changed', changedListener);

      wrapped.clear();

      expect(changedListener).toHaveBeenCalled();
    });
    it('should invoke clear listeners', function () {
      clearListener = jasmine.createSpy();
      wrapped.addEventListener('clear', clearListener);

      wrapped.clear();

      expect(clearListener).toHaveBeenCalled();
    });
  });
});
