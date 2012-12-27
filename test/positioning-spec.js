describe("Map visualisations", function() {
  describe ("map diff", function(){
    it ("detects changes in node positions", function(){
      var result=mapDiff(
          {nodes:{ '1': { offset : { top: 10, left: 5 }}}},
          {nodes:{ '1': { offset : { top: 20, left: 15}}}}
        );
      expect (result.moved).toEqual(['1']);
      expect (result.added).toEqual([]);
      expect (result.renamed).toEqual([]);
      expect (result.deleted).toEqual([]);
      expect (result.resized).toEqual([]);
    });
    it ("detects new nodes", function(){
      var result=mapDiff(
          {nodes: {} },
          {nodes:{ '1': { offset : { top: 20, left: 15}}}}
        );
      expect (result.added).toEqual(['1']);
      expect (result.moved).toEqual([]);
      expect (result.deleted).toEqual([]);
      expect (result.renamed).toEqual([]);
      expect (result.resized).toEqual([]);
    });
    it ("detects removed nodes", function(){
      var result=mapDiff(
          {nodes:{ '1': { offset : { top: 20, left: 15}}}},
          {nodes: {} }
        );
      expect (result.deleted).toEqual(['1']);
      expect (result.renamed).toEqual([]);
      expect (result.added).toEqual([]);
      expect (result.moved).toEqual([]);
      expect (result.resized).toEqual([]);
    });
    it ("detects nodes with changed sizes, even if they moved", function(){
      var result=mapDiff(
          {nodes:{ '1': { offset : { top: 10, left: 5 }, dimensions: { width:100,height:100 }},
                   '2': { offset : { top: 10, left: 5 }, dimensions: { width:100,height:100 }}}},
          {nodes:{ '1': { offset : { top: 10, left: 15 }, dimensions: { width:10,height:10 }},
                   '2': { offset : { top: 10, left: 5 }, dimensions: { width:10,height:10 }}}}
        );
      expect (result.deleted).toEqual([]);
      expect (result.renamed).toEqual([]);
      expect (result.added).toEqual([]);
      expect (result.resized).toEqual(['1','2']);
      expect (result.moved).toEqual(['1']);
    });
    it ("detects changes to text", function(){
      var result=mapDiff(
          {nodes:{ '1': {text:'old'}}},
          {nodes:{ '1': {text:'new'}}}
        );
      expect (result.renamed).toEqual(['1']);
      expect (result.moved).toEqual([]);
      expect (result.added).toEqual([]);
      expect (result.deleted).toEqual([]);
      expect (result.resized).toEqual([]);
    });
    it ("detects new connections", function(){
      var result=mapDiff(
          {connectors:[]},
          {connectors:[{from:1, to:2}]}
        );
      expect (result.connected).toEqual([{from:1, to:2}]);
    });
    it ("detects removed connections", function(){
      var result=mapDiff(
          {connectors:[{from:1, to:2}]},
          {connectors:[]}
        );
      expect (result.disconnected).toEqual([{from:1, to:2}]);
    });
    it ("does not detect any changes if lists are equal", function(){

      var result=mapDiff(
          {nodes:{ '1': { text:'some title', offset : { top: 10, left: 5 }, dimensions: { width:100,height:100 }},
                   '2': { text:'other title',offset : { top: 1, left: 50 }, dimensions: { width:10,height:10 }}},
           connectors:[{from:1, to:2}]},
          {nodes:{ '1': { text:'some title', offset : { top: 10, left: 5 }, dimensions: { width:100,height:100 }},
                   '2': { text:'other title',offset : { top: 1, left: 50 }, dimensions: { width:10,height:10 }}},
           connectors:[{from:1, to:2}]}
          );
      expect (result.renamed).toEqual([]);
      expect (result.moved).toEqual([]);
      expect (result.added).toEqual([]);
      expect (result.deleted).toEqual([]);
      expect (result.resized).toEqual([]);
      expect (result.connected).toEqual([]);
      expect (result.disconnected).toEqual([]);

    });
  });
  describe ("ideas_to_nodes", function(){
    function expect_node_label(jquery_selector, expected_label){
      expect(jquery_selector).toBe('div.node'); 
      expect(jquery_selector).toContain('span.label');
      expect(jquery_selector.children('.label')).toHaveText(expected_label);
    }

    describe("node positioning", function(){
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
      it ("handles floating point values as numbers, not strings", function(){
        var actual=ideas_to_nodes(
        { title: 'Node 1.1',
                     ideas: {
                       1: {title: 'Node 1.1.1'},
                       2: {title: 'Node 1.1.2'},
                       1.5: {title: 'Node 1.1.3'}
                     }
                   });
        expect_node_label(actual.children('.children').last().children('.node').first(),'Node 1.1.1');
        expect_node_label(actual.children('.children').last().children('.node').eq(1),'Node 1.1.3');
        expect_node_label(actual.children('.children').last().children('.node').last(),'Node 1.1.2');
      
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
      it ('marks node with the idea ID', function(){
        var actual=ideas_to_nodes({id:'idea1',title:'My idea'})
        expect(actual).toBe('div.node');
        expect(actual.attr('idea')).toBe('idea1');
        expect(actual.children('.label').attr('idea')).toBe('idea1');
      });
    });
  });
});

