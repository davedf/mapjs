describe("Positioning", function() {
  var Node=function(name){
    var node_text=name;
    var children=[];
    return {
      text:function(){return node_text;},
      addNode:function(node){
        children.push(node);
      },
      children:function(){
        return children;
      }
    };
  };
  var child_offset=function(parent_coordinates, param_options, child_rotation_angle){
    var layout_options=$.extend({},param_options, {margin_x:50, margin_y:50});
    return {
      offset_x:parent_coordinates[1][0]+Math.cos(child_rotation_angle)*layout_options.margin_x,
      offset_y:parent_coordinates[1][1]+Math.sin(child_rotation_angle)*layout_options.margin_y
    };
  }
  var position_map=function(map_root,param_options,fontSizer){
    var default_options={ offset_x:0, offset_y:0, viewport_height:0, viewport_width:0, padding_x:0, padding_y:0, margin_x:50, margin_y:50};
    var layout_options=$.extend({},default_options,param_options); 
    var box=fontSizer(map_root.text());
    var viewport_center=[layout_options.viewport_width/2,layout_options.viewport_height/2];
    var root_coordinates=translate([
          [viewport_center[0]-box[0]/2-layout_options.padding_x, viewport_center[1]-box[1]/2-layout_options.padding_y],
          [viewport_center[0]+box[0]/2+layout_options.padding_x, viewport_center[1]+box[1]/2+layout_options.padding_y]
    ],[layout_options.offset_x,layout_options.offset_y]);
    var index=0;
    return {
        coordinates:root_coordinates,
        node:map_root,
        children: map_root.children().map(function(node){ 
          var child_options=$.extend([],param_options,child_offset(root_coordinates,param_options,(Math.PI*index++)/map_root.children().length));
          return position_map(node,child_options,fontSizer); 
        })
    };
  }
  var translate=function(coord_array,vector){
    return coord_array.map(function(point){
      return [point[0]+vector[0],point[1]+vector[1]];
    });
  }
  var test_map=function(){
      var root=new Node("center");
      root.addNode(new Node("left"));
      return root;
  }
  var intersects=function(coordinates_1, coordinates_2){
    var intersection=[
      [Math.max(coordinates_1[0][0], coordinates_2[0][0]),Math.max(coordinates_1[0][1],coordinates_2[0][1])],
      [Math.min(coordinates_1[1][0], coordinates_2[1][0]),Math.min(coordinates_1[1][1],coordinates_2[1][1])]
      ];
    return intersection[1][0]>=intersection[0][0] && intersection [1][1]>=intersection[0][1]; 
  }
  describe ("translate", function(){
    it ("adds a vector to all the coordinates in the array", function(){
      expect(translate([[1,2],[3,4],[5,-6]],[10,10])).toEqual([[11,12],[13,14],[15,4]]);
    });
  
  });
  describe ("intersects", function(){
    it ("returns true for rectangles that share a common area", function(){
      var mid_rect=[[5,5],[10,10]]
      expect(intersects(mid_rect,[[ 1, 1],[ 7, 7]])).toEqual(true);
      expect(intersects(mid_rect,[[ 7, 1],[14, 7]])).toEqual(true);
      expect(intersects(mid_rect,[[ 1, 7],[ 7,14]])).toEqual(true);
      expect(intersects(mid_rect,[[ 7, 7],[14,14]])).toEqual(true);
      expect(intersects(mid_rect,[[ 6, 6],[ 9, 9]])).toEqual(true);
      expect(intersects(mid_rect,[[ 5, 5],[10,10]])).toEqual(true);
    });
    it ("returns false for rectangles that do not share a common area", function(){
      expect(intersects([[5,5],[10,10]],[[14, 14],[17, 17]])).toEqual(false);
      expect(intersects([[5,5],[10,10]],[[1,1],[4,4]])).toEqual(false);
    });
  });

  var layout_test_map=function(){
    var boxWidth=100,boxHeight=50,fontSizer=function(){return [boxWidth,boxHeight]};
    var layout_options={ viewport_height:800, viewport_width:1200, padding_x:10, padding_y:5};
    return position_map(test_map(),layout_options,fontSizer);
  }
  it("lays out the root node in the centre, padded according to options", function() {
    expect(layout_test_map().coordinates).toEqual([[540,370],[660,430]]);
  });
  it("lays out secondary nodes without overlapping", function(){
    var screenMap=layout_test_map();
    expect (screenMap.children.length).toEqual(test_map().children().length); 
    var previous=[screenMap.coordinates];
    screenMap.children.forEach(function(child){
      previous.forEach(function(prev_coordinates){
        expect (intersects(prev_coordinates,child.coordinates)).toBe(false);
      });
      previous.push(child.coordinates);
    });
  });
  check_node_attached=function(screen_map, node){
    expect(screen_map.node).toBe(node);
    var index=0;
    node.children().forEach(function(child){
      check_node_attached(screen_map.children[index++],child);
    });
  }
  it("attaches a reference to the relevant node on each positioned element", function(){
    var boxWidth=100,boxHeight=50,fontSizer=function(){return [boxWidth,boxHeight]};
    var layout_options={ viewport_height:800, viewport_width:1200, padding_x:10, padding_y:5};
    var test=test_map();
    var screen_map= position_map(test,layout_options,fontSizer);
    check_node_attached(screen_map,test);
  });
});
