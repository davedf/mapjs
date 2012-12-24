describe ("content management", function(){
  describe ("max ID", function(){
      it ("calculates the maximum assigned ID already in the idea hierarchy", function(){
      
        var ideas={id:22, title:'My Idea', ideas: { 1: {id:23, title:'My First Subidea'}, '-1':{id:54,title:'Max'}}};
        expect (max_id(ideas)).toBe(54);
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
      it ("makes a node observable for title changes", function(){
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
        it ('changes the title of the current node only if it matches ID in command', function(){
          var first=content({id:'Id1',title:'My Idea'});
          var second=content({id:'Id2',title:'Untouched'});
          var first_succeeded=cmd_update_title(first,'Id1','Updated');
          var second_succeeded=cmd_update_title(second,'Id1','Updated');
          expect(first_succeeded).toBeTruthy();
          expect(second_succeeded).toBeFalsy();
          expect(first.title).toBe('Updated');
          expect(second.title).toBe('Untouched');
        });
        it ('propagates changes to child nodes if the ID does not match, succeeding if there is a matching child', function(){
          var ideas=content({id:1, title:'My Idea', 
                            ideas: {  1: {id:2, title:'My First Subidea', ideas:{1:{id:3, title:'My First sub-sub-idea'}}}}});
          var result=cmd_update_title(ideas,3,'Updated');
          expect(result).toBeTruthy();
          expect(ideas.ideas[1].ideas[1].title).toBe('Updated'); 
          expect(cmd_update_title(ideas,'Non Existing','XX')).toBeFalsy();
        });
    });
  });
});
