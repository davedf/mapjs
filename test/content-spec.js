describe ("content management", function(){
  describe ("max ID", function(){
      it ("calculates the maximum assigned ID already in the idea hierarchy", function(){
      
        var ideas={id:22, title:'My Idea', ideas: { 1: {id:23, title:'My First Subidea'}, '-1':{id:54,title:'Max'}}};
        expect (max_id(ideas)).toBe(54);
      });
  });
  describe ("find_child_rank_by_id", function(){
      var idea={id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}};
      it ('returns the key in the parent idea list of an idea by its id', function(){  
        expect( find_child_rank_by_id(idea,2)).toEqual('5');
        expect( find_child_rank_by_id(idea,3)).toEqual('10');
        expect( find_child_rank_by_id(idea,4)).toEqual('15');
      });
      it ('returns undefined if no such child exists', function(){
        expect( find_child_rank_by_id(idea, 'xxx')).toBeUndefined();
      });
  });
  describe ("content wapper", function(){
      it ("attaches update function for title", function(){
        var wrapped=content({title:'My Idea'});
        wrapped.set_title('Updated')
        expect (wrapped.title).toBe('Updated');
      });
      it ("recursivelly wraps sub-ideas", function(){
        var wrapped=content({id:1, title:'My Idea', ideas: { 1: {id:2, title:'My First Subidea'}}});
        wrapped.ideas[1].set_title('Sub-updated');
        expect (wrapped.ideas[1].title).toBe('Sub-updated');
      });
      it ("makes a idea observable for title changes", function(){
        var listener=jasmine.createSpy('title_listener');
        var wrapped=content({title:'My Idea'});
        wrapped.addEventListener('Title_Updated',listener);
        wrapped.set_title('Updated');
        expect(listener).toHaveBeenCalledWith(wrapped);
      });
      it ("automatically assigns IDs to ideas without IDs", function(){
        var wrapped=content({title:'My Idea'});
        expect(wrapped.id).toBe(1);
      });
      it ("does not touch any IDs already assigned", function(){
        var wrapped=content({id:22, title:'My Idea', ideas: { 1: {id:23, title:'My First Subidea'}}});
        wrapped.ideas[1].set_title(22);
        expect (wrapped.ideas[1].id).toBe(23);
      });
      it ("skips over any IDs already assigned while adding new IDs", function(){
        var wrapped=content({id:55, title:'My Idea', ideas: { 1: {title:'My First Subidea'}}});
        expect (wrapped.ideas[1].id).toBe(56);
      });
  });
  describe ("command processing",function(){
    describe ("cmd_update_title", function(){
        it ('changes the title of the current idea only if it matches ID in command', function(){
          var first=content({id:'Id1',title:'My Idea'});
          var second=content({id:'Id2',title:'Untouched'});
          var first_succeeded=cmd_update_title(first,'Id1','Updated');
          var second_succeeded=cmd_update_title(second,'Id1','Updated');
          expect(first_succeeded).toBeTruthy();
          expect(second_succeeded).toBeFalsy();
          expect(first.title).toBe('Updated');
          expect(second.title).toBe('Untouched');
        });
        it ('propagates changes to child ideas if the ID does not match, succeeding if there is a matching child', function(){
          var ideas=content({id:1, title:'My Idea', 
                            ideas: {  1: {id:2, title:'My First Subidea', ideas:{1:{id:3, title:'My First sub-sub-idea'}}}}});
          var result=cmd_update_title(ideas,3,'Updated');
          expect(result).toBeTruthy();
          expect(ideas.ideas[1].ideas[1].title).toBe('Updated'); 
          expect(cmd_update_title(ideas,'Non Existing','XX')).toBeFalsy();
        });
    });

    describe ("cmd_reorder", function(){
      it ('reorders immediate children by changing the rank of an idea to be immediately before the provided idea', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=cmd_reorder(idea,4,3); 
        expect(result).toBeTruthy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[10].id).toBe(3);
        var new_key=find_child_rank_by_id(idea,4);
        expect(new_key).toBeLessThan(10);
        expect(new_key).not.toBeLessThan(5);
      });
      it ('does nothing if the idea should be ordered before itself', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 12: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=cmd_reorder(idea,3,3); 
        expect(result).toBeTruthy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[12].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
      });
      it ('does nothing if the idea should be ordered in the same place', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 12: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=cmd_reorder(idea,3,4); 
        expect(result).toBeTruthy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[12].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
      });
      it ('fails if it cannot find appropriate idea to reorder', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=cmd_reorder(idea,12,3); 
        expect(result).toBeFalsy();
      });
      it ('orders negative ideas as negative ranks', function(){
        var idea=content({id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}});
        var result=cmd_reorder(idea,4,3); 
        expect(result).toBeTruthy();
        expect(idea.ideas[-5].id).toBe(2);
        expect(idea.ideas[-10].id).toBe(3);
        var new_key=find_child_rank_by_id(idea,4);
        expect(new_key).not.toBeLessThan(-10);
        expect(new_key).toBeLessThan(-5);
      });
      it ('puts the child in the first rank if the boundary idea was the first', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=cmd_reorder(idea,4,2); 
        expect(result).toBeTruthy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[10].id).toBe(3);
        var new_key=find_child_rank_by_id(idea,4);
        expect(new_key).toBeLessThan(5);
      });
      it ('puts the child in the last rank if the boundary idea was not defined', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=cmd_reorder(idea,2); 
        expect(result).toBeTruthy();
        expect(idea.ideas[10].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
        var new_key=find_child_rank_by_id(idea,2);
        expect(new_key).not.toBeLessThan(15);
      });
      it ('does nothing if the boundary idea was not defined and child was already last', function(){
        var idea=content({id:1, title:'I1', ideas: { 5: { id: 2, title:'I2'}, 10: { id:3, title:'I3'}, 15 : {id:4, title:'I4'}}});
        var result=cmd_reorder(idea,4); 
        expect(result).toBeTruthy();
        expect(idea.ideas[5].id).toBe(2);
        expect(idea.ideas[10].id).toBe(3);
        expect(idea.ideas[15].id).toBe(4);
      });
      it ('puts the child closest to zero from the - side if the boundary idea was the smallest negative', function(){
        var idea=content({id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}});
        var result=cmd_reorder(idea,4,2); 
        expect(result).toBeTruthy();
        expect(idea.ideas[-5].id).toBe(2);
        expect(idea.ideas[-10].id).toBe(3);
        var new_key=find_child_rank_by_id(idea,4);
        console.log(new_key);
        expect(new_key).not.toBeLessThan(-5);
        expect(new_key).toBeLessThan(0);
      });
      it ('puts the child in the last negative rank if the boundary idea was not defined but current rank is negative', function(){
        var idea=content({id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}});
        var result=cmd_reorder(idea,2); 
        expect(result).toBeTruthy();
        expect(idea.ideas[-10].id).toBe(3);
        expect(idea.ideas[-15].id).toBe(4);
        var new_key=find_child_rank_by_id(idea,2);
        expect(new_key).toBeLessThan(-15);
      });
      it ('does nothing if the boundary idea was not defined and child was already last', function(){
        var idea=content({id:1, title:'I1', ideas: { '-5': { id: 2, title:'I2'}, '-10': { id:3, title:'I3'}, '-15' : {id:4, title:'I4'}}});
        var result=cmd_reorder(idea,4); 
        expect(result).toBeTruthy();
        expect(idea.ideas[-5].id).toBe(2);
        expect(idea.ideas[-10].id).toBe(3);
        expect(idea.ideas[-15].id).toBe(4);
      });
    });
  });
});
