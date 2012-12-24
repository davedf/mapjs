describe("Map visualisations", function() {
  describe ("ideas_to_nodes", function(){
    it ("converts a single childless idea into a node element", function(){
      var actual=ideas_to_nodes({title:'My Idea'});
      expect_node_label(actual,'My Idea');
      expect(actual).not.toContain('.children');

    });
    it ("converts a child with one positive rank node into a node div with one right children sub-div", function(){
      var actual=ideas_to_nodes({title:'My Idea', ideas: { 1: {title:'My First Subidea'}}});
      expect_node_label(actual,'My Idea');
      expect(actual.children().length).toBe(2);
      expect(actual.children().last()).toBe('.children');
      expect_node_label(actual.children('.children').find('.node'),'My First Subidea');
    });
    it ("converts a child with one negative rank node into a node div with one left children sub-div", function(){
      var actual=ideas_to_nodes({title:'My Idea', ideas: { '-1': {title:'My First Subidea'}}});
      expect_node_label(actual,'My Idea');
      expect(actual.children().length).toBe(2);
      expect(actual.children().first()).toBe('.children');
      expect_node_label(actual.children('.children').find('.node'),'My First Subidea');
    });
    it ("splits positive and negative subideas into left/right children nodes, ordered by index; positive ascending, negative descending", function(){
      var actual=ideas_to_nodes({title:'My Idea', 
            ideas: { 1: {title:'My First Subidea'}, 2:{title:'My Second Subidea'},
                     '-1': {title:'My Third Subidea'}, '-2':{title:'My Fourth Subidea'}}
      });
      expect_node_label(actual.children('.children').first().children('.node').first(),'My Third Subidea');
      expect_node_label(actual.children('.children').first().children('.node').last(),'My Fourth Subidea');
      expect_node_label(actual.children('.children').last().children('.node').first(),'My First Subidea');
      expect_node_label(actual.children('.children').last().children('.node').last(),'My Second Subidea');
    });
    it ("stacks up sub-sub-ideas in the direction of it's parent", function(){
      var actual=ideas_to_nodes({title:'My Idea', 
            ideas: { 1: {title:'My First Subidea', ideas:{1:{title:'My First sub-sub-idea'},2:{title:'My Second sub-sub-idea'}}},
                     '-2': {title:'My Second Subidea',ideas:{1:{title:'My Third sub-sub-idea'}}}
                   }
          });
      var left_child=actual.children('.children').first().children('.node'); 
      var right_child=actual.children('.children').last().children('.node'); 
      expect(left_child.children().first()).toBe('.children');
      expect(right_child.children().last()).toBe('.children');

      expect_node_label(left_child.children('.children').children('.node').first(),'My Third sub-sub-idea');
      expect_node_label(right_child.children('.children').children('.node').first(),'My First sub-sub-idea');
      expect_node_label(right_child.children('.children').children('.node').last(),'My Second sub-sub-idea');
    });
  });
});
