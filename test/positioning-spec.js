function sort_assoc_array(assoc_array){
  var result=[];
  $.each(assoc_array, function(key,value){ result.push(value)});
  return result;
}
function split_point(length){
  if (length%2==0) return length/2;
  return Math.floor(length/2)+1;
}
function ideas_to_nodes(json_ideas){
  var node_div= $('<div class="node"></div>');
  var left_children=$('<div class="children"/>');
  var right_children=$('<div class="children" />');
  if (json_ideas['ideas']){
    var sorted_subideas=sort_assoc_array(json_ideas['ideas']);
    var i=0;
    for (;i<split_point(sorted_subideas.length);i++){
      ideas_to_nodes(sorted_subideas[i]).appendTo(right_children);
    };
    for (;i<sorted_subideas.length;i++){
      ideas_to_nodes(sorted_subideas[i]).appendTo(left_children);
    };
  }
  if (left_children.children().length>0) left_children.appendTo(node_div);
  node_div.append('<span class="label">'+json_ideas.title+'</span>');
  if (right_children.children().length>0) right_children.appendTo(node_div);
  return node_div;
}
function expect_node_label(jquery_selector, expected_label){
      expect(jquery_selector).toBe('div.node'); 
      expect(jquery_selector).toContain('span.label');
      expect(jquery_selector.children('.label')).toHaveText(expected_label);
}
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
  });
});
