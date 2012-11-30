describe("Positioning", function() {
  var Node=function(name){
    var node_text=name;
    return {
      text:function(){return node_text;}
    };
  };
  var position_map=function(map_root,param_options,fontSizer){
    var default_options={ viewport_height:0, viewport_width:0, padding_x:0, padding_y:0};
    var layout_options=$.extend({},default_options,param_options); 
    var box=fontSizer(map_root.text());
    viewport_center=[layout_options.viewport_width/2,layout_options.viewport_height/2];
    return {root:{coordinates:[
      [viewport_center[0]-box[0]/2-layout_options.padding_x, viewport_center[1]-box[1]/2-layout_options.padding_y],
      [viewport_center[0]+box[0]/2+layout_options.padding_x, viewport_center[1]+box[1]/2+layout_options.padding_y]
    ]}};
  }
  it("lays out the root node in the centre", function() {
    var node=new Node("center");
    var boxWidth=100,boxHeight=50,fontSizer=function(){return [boxWidth,boxHeight]};
    var layout_options={
      viewport_height:800,
      viewport_width:1200,
      padding_x:10,
      padding_y:5};
    var screenMap=position_map(node,layout_options,fontSizer);
    expect(screenMap.root.coordinates).toEqual([[540,370],[660,430]]);
  });
});
