describe ("content management", function(){
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
  });
});
