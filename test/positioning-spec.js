describe("Array utils", function(){
  describe ("sort_assoc_array", function(){
    it ('converts a key-value pair into a simple indexed array', function(){
      expect(sort_assoc_array({1:'one'})).toEqual(['one']);
      expect(sort_assoc_array({2:'two',1:'one'})).toEqual(['one','two']);
    });
  });
});
describe("Map visualisations", function() {
  describe ("ideas_to_nodes", function(){
    it ("converts a single childless idea into a node element", function(){
      var actual=ideas_to_nodes({title:'My Idea'});
      expect_node_label(actual,'My Idea');
      expect(actual).not.toContain('.children');

    });
    it ("converts a child with one node into a node div with one a children sub-div", function(){
      var actual=ideas_to_nodes({title:'My Idea', ideas: { 1: {title:'My First Subidea'}}});
      expect_node_label(actual,'My Idea');
      expect(actual.children().length).toBe(2);
      expect(actual.children().last()).toBe('.children');
      expect_node_label(actual.find('.label + .children').find('.node'),'My First Subidea');
    });
    it ("converts a child with two nodes into a node div with two children sub-divs", function(){
      var actual=ideas_to_nodes({title:'My Idea', ideas: { 1: {title:'My First Subidea'}, 2:{title:'My Second Subidea'}}});
      expect_node_label(actual,'My Idea');
      expect(actual.children().length).toBe(3);
      expect(actual.children().first()).toBe('.children');
      expect(actual.children().last()).toBe('.children');
      expect_node_label(actual.children().first().find('.node'),'My Second Subidea');
    });
    it ("balances subideas into subnodes left-right", function(){
      var actual=ideas_to_nodes({title:'My Idea', 
            ideas: { 1: {title:'My First Subidea'}, 2:{title:'My Second Subidea'},
                     3: {title:'My Third Subidea'}, 4:{title:'My Fourth Subidea'}}
      });
      expect_node_label(actual.children('.children').first().children('.node').first(),'My Third Subidea');
      expect_node_label(actual.children('.children').first().children('.node').last(),'My Fourth Subidea');
      expect_node_label(actual.children('.children').last().children('.node').first(),'My First Subidea');
      expect_node_label(actual.children('.children').last().children('.node').last(),'My Second Subidea');
    });
    it ("orders subideas based on index", function(){
      var actual=ideas_to_nodes({title:'My Idea', 
            ideas: { 1: {title:'My First Subidea'}, 3:{title:'My Second Subidea'},
                     2: {title:'My Third Subidea'}, 4:{title:'My Fourth Subidea'}}
      });
      expect_node_label(actual.children('.children').first().children('.node').first(),'My Second Subidea');
      expect_node_label(actual.children('.children').first().children('.node').last(),'My Fourth Subidea');
      expect_node_label(actual.children('.children').last().children('.node').first(),'My First Subidea');
      expect_node_label(actual.children('.children').last().children('.node').last(),'My Third Subidea');
    });
    it ("stacks up sub-sub-ideas in the direction of it's parent", function(){
      
      var actual=ideas_to_nodes({title:'My Idea', 
            ideas: { 1: {title:'My First Subidea', ideas:{1:{title:'My First sub-sub-idea'},2:{title:'My Second sub-sub-idea'}}},
                     2: {title:'My Second Subidea',ideas:{1:{title:'My Third sub-sub-idea'}}}
                   }
          });
      var left_child=actual.children('.children').first().children('.node'); 
      var right_child=actual.children('.children').last().children('.node'); 
      expect(left_child.children().length).toBe(2);
      expect(right_child.children().length).toBe(2);
      expect(left_child.children().first()).toBe('.children');
      expect(right_child.children().last()).toBe('.children');

      expect_node_label(left_child.children('.children').children('.node').first(),'My Third sub-sub-idea');
      expect_node_label(right_child.children('.children').children('.node').first(),'My First sub-sub-idea');
      expect_node_label(right_child.children('.children').children('.node').last(),'My Second sub-sub-idea');
    });
  });
});
