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
        it ("fires Title_Updated event when the title changes", function(){
          var listener=jasmine.createSpy('title_listener');
          var wrapped=content({title:'My Idea', id:2, ideas: { 1: {id:1, title:'Old title'}}});
          wrapped.addEventListener('Title_Updated', listener);
          wrapped.updateTitle(1, 'Updated');
          expect(listener).toHaveBeenCalledWith(wrapped.ideas[1]);
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
            expect(asArray[0].title).toBe('First idea');
            expect(asArray[0].ideas).toBeFalsy();
            expect(asArray[1].title).toBe('Second idea');
            expect(asArray[1].ideas).toBeFalsy();
        
        });
        it ('assigns the next available ID to the new idea', function(){
            var idea=content({id:71,title:'My Idea'});
            idea.addSubIdea(71);
            expect(_.toArray(idea.ideas)[0].id).toBe(72);
        });
        it ('assigns the first subidea the rank of 1', function(){
            var idea=content({id:71,title:'My Idea'});
            idea.addSubIdea(71);
            expect(idea.ideas[1].id).toBe(72);
        });
        it ('assigns a rank greater than any of its siblings', function(){
          var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
          idea.addSubIdea(1);
          var new_key=idea.findChildRankById(5);
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
        it ('fires Idea_Added when a new idea is added', function(){
            var idea=content({id:71,title:'My Idea'});
            var addedListener=jasmine.createSpy('Idea_Added');
            idea.addEventListener('Idea_Added', addedListener);
            idea.addSubIdea(71);
            expect(addedListener).toHaveBeenCalledWith(idea.ideas[1]);
        });
        it ('takes negative rank items as absolute while calculating new rank ID (bug resurrection test)', function(){
          var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, '-15': { id:3, title:'I3'}, '-16' : {id:4, title:'I4'}}});
          idea.addSubIdea(1);
          var new_key=idea.findChildRankById(5);
          expect(new_key).not.toBeLessThan(16);
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
      it ("fires a Parent_Changed event when a parent is changed", function(){
        var listener=jasmine.createSpy('Parent_Changed');
        idea.addEventListener('Parent_Changed',listener);
        var result=idea.changeParent(4,5);
        expect(listener).toHaveBeenCalledWith(4);
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
        it ('fires Idea_Removed with old idea as argument', function(){
          var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
          var addedListener=jasmine.createSpy('Idea_Added');
          idea.addEventListener('Idea_Removed', addedListener);
          idea.removeSubIdea(3);
          expect(addedListener).toHaveBeenCalledWith(3);
        });
    });
    describe ("positionBefore", function(){
      it ('reorders immediate children by changing the rank of an idea to be immediately before the provided idea', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=idea.positionBefore(4,3); 
        expect(result).toBeTruthy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[10].id).toBe(3);
        var new_key=idea.findChildRankById(4);
        expect(new_key).toBeLessThan(10);
        expect(new_key).not.toBeLessThan(5);
      });
      it ('does nothing if the idea should be ordered before itself', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 12: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=idea.positionBefore(3,3); 
        expect(result).toBeTruthy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[12].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
      });
      it ('does nothing if the idea should be ordered in the same place', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 12: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=idea.positionBefore(3,4); 
        expect(result).toBeTruthy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[12].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
      });
      it ('fails if it cannot find appropriate idea to reorder', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=idea.positionBefore(12,3); 
        expect(result).toBeFalsy();
      });
      it ('orders negative ideas as negative ranks', function(){
        var idea=content({id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}});
        var result=idea.positionBefore(4,3); 
        expect(result).toBeTruthy();
        expect(idea.ideas[-5].id).toBe(2);
        expect(idea.ideas[-10].id).toBe(3);
        var new_key=idea.findChildRankById(4);
        expect(new_key).not.toBeLessThan(-10);
        expect(new_key).toBeLessThan(-5);
      });
      it ('puts the child in the first rank if the boundary idea was the first', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=idea.positionBefore(4,2); 
        expect(result).toBeTruthy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[10].id).toBe(3);
        var new_key=idea.findChildRankById(4);
        expect(new_key).toBeLessThan(5);
      });
      it ('puts the child in the last rank if the boundary idea was not defined', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=idea.positionBefore(2); 
        expect(result).toBeTruthy();
        expect(idea.ideas[10].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
        var new_key=idea.findChildRankById(2);
        expect(new_key).not.toBeLessThan(15);
      });
      it ('does nothing if the boundary idea was not defined and child was already last', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=idea.positionBefore(4); 
        expect(result).toBeTruthy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[10].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
      });
      it ('puts the child closest to zero from the - side if the boundary idea was the smallest negative', function(){
        var idea=content({id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}});
        var result=idea.positionBefore(4,2); 
        expect(result).toBeTruthy();
        expect(idea.ideas[-5].id).toBe(2);
        expect(idea.ideas[-10].id).toBe(3);
        var new_key=idea.findChildRankById(4);
        expect(new_key).not.toBeLessThan(-5);
        expect(new_key).toBeLessThan(0);
      });
      it ('puts the child in the last negative rank if the boundary idea was not defined but current rank is negative', function(){
        var idea=content({id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}});
        var result=idea.positionBefore(2); 
        expect(result).toBeTruthy();
        expect(idea.ideas[-10].id).toBe(3);
        expect(idea.ideas[-15].id).toBe(4);
        var new_key=idea.findChildRankById(2);
        expect(new_key).toBeLessThan(-15);
      });
      it ('does nothing if the boundary idea was not defined and child was already last', function(){
        var idea=content({id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}});
        var result=idea.positionBefore(4); 
        expect(result).toBeTruthy();
        expect(idea.ideas[-5].id).toBe(2);
        expect(idea.ideas[-10].id).toBe(3);
        expect(idea.ideas[-15].id).toBe(4);
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
      it ('makes the root observable for any child order changes', function(){
        var idea=content({id:0,title:'I0',ideas:{9:{id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}}}});
        childRankSpy=jasmine.createSpy('ChildRankListener');
        idea.addEventListener('Child_Ranks_Changed', childRankSpy);
        var result=idea.positionBefore(4,2);
        expect(childRankSpy).toHaveBeenCalledWith(idea.ideas[9]);
      });
    });
  });
});
