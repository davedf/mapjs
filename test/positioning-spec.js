describe("Positioning", function() {
  var Node=function(name){
    var node_text=name;
    return {
      text:function(){return node_text;}
    };
  };
  position_map=function(map_root,viewport_height,viewport_width,fontSizer){
    var box=fontSizer(map_root.text());
    viewport_center=[viewport_width/2,viewport_height/2];
    return {root:{coordinates:[
      [viewport_center[0]-box[0]/2,viewport_center[1]-box[1]/2],
      [viewport_center[0]+box[0]/2,viewport_center[1]+box[1]/2]
    ]}};
  }
  it("lays out the root node in the centre", function() {
    var node=new Node("center");
    var boxWidth=100,boxHeight=50,fontSizer=function(){return [boxWidth,boxHeight]};
    var viewport_height=800,viewport_width=1200;
    var screenMap=position_map(node,viewport_height,viewport_width,fontSizer);
    expect(screenMap.root.coordinates).toEqual([[550,375],[650,425]]);
  });
});
