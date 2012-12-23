function ideas_to_nodes(json_ideas){
  return $('<div class="node"><span class="label">'+json_ideas.title+'</span></div>');
}

describe("Map visualisations", function() {
  describe ("ideas_to_nodes", function(){
    it ("converts a single childless idea into a node element", function(){
      var actual=ideas_to_nodes({title:'My Idea'});
      expect(actual).toBe('div.node'); 
      expect(actual).toContain('span.label');
      expect(actual).not.toContain('.children');
      expect(actual.find('.label:first')).toHaveText('My Idea');
    });
  });
});
