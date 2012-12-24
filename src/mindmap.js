function split_point(length){
  if (length%2==0) return length/2;
  return Math.floor(length/2)+1;
}
function ideas_to_nodes(json_ideas,props){
  var defaults={direction:'split'};
  var options=$.extend({},defaults,props);
  var node_div= $('<div class="node"></div>');
  var left_children=$('<div class="children"/>');
  var right_children=$('<div class="children" />');
  if (json_ideas['ideas']){
    var sorted_subideas= _(json_ideas['ideas']).sortBy(function(val,key){return parseFloat(key)})
    var i=0;
    for (;(options['direction']=='right' && i<sorted_subideas.length)  || (options['direction']=='split' && i<split_point(sorted_subideas.length));i++){
      ideas_to_nodes(sorted_subideas[i],$.extend({},props,{direction:'right'})).appendTo(right_children);
    };
    for (;i<sorted_subideas.length;i++){
      ideas_to_nodes(sorted_subideas[i],$.extend({},props,{direction:'left'})).appendTo(left_children);
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

function v_middle(jquery_elem){
  return jquery_elem.offset().top + jquery_elem.outerHeight()/2;
}
function widest_child(jquery_elem){
  if (jquery_elem.children('.node').length==0) return jquery_elem.outerWidth();
  var max=0;
  jquery_elem.children('.node').each(function(){
    var current=widest_child($(this));
    if (max<current) max=current;
  });
  return jquery_elem.outerWidth()+max;
}
function paint_map_connections(jquery_element){
  jquery_element.width(2*widest_child(jquery_element.find('.node:first')));
  $('.node .node .label').each(function(){
    var node=$(this);
    var vertical_sensitivity_threshold=5;
    var parent=node.parent().parent().parent().children('.label:first');
    if (node.length>0 && parent.length>0){
      node.children('.connect').detach(); 
      var connect =$('<div>&nbsp</div>').appendTo(node);
      connect.addClass('connect');
      if (Math.abs(v_middle(parent)-v_middle(node))<vertical_sensitivity_threshold){
        connect.addClass("connect_horizontal");
        connect.offset( { top: v_middle(parent), 
          left: Math.min(parent.offset().left+parent.outerWidth(),node.offset().left+node.outerWidth()) });
        connect.width(
          Math.max(node.offset().left-parseInt(node.css('padding-left')),
            parent.offset().left)-connect.offset().left);
      }
      else {
        if (v_middle(parent)>v_middle(node) && parent.offset().left<node.offset().left){
          connect.addClass("connect_down_left");
          connect.offset(
            { top: node.offset().top+node.outerHeight()/2, left: parent.offset().left+parent.outerWidth()/2 });
        }
        else if (v_middle(parent)<v_middle(node) && parent.offset().left<node.offset().left){
          connect.addClass("connect_up_left");
          connect.offset(
              { top: parent.offset().top+parent.outerHeight(), left: parent.offset().left+parent.outerWidth()/2 });
        }
        else if (v_middle(parent)>v_middle(node) && parent.offset().left>node.offset().left){
          connect.addClass("connect_down_right");
          connect.offset(
              { top: node.offset().top+node.outerHeight()/2, left: node.offset().left+node.outerWidth() });
        }
        else if (v_middle(parent)<v_middle(node) && parent.offset().left>node.offset().left){
          connect.addClass("connect_up_right");
          connect.offset(
              { top: parent.offset().top+parent.outerHeight(), left: node.offset().left+node.outerWidth() });
        }
        connect.width(
            Math.max(node.offset().left-parseInt(node.css('padding-left')),
              parent.offset().left+parent.outerWidth()/2)-connect.offset().left);
      }
      connect.height(Math.max(parent.offset().top-parseInt(parent.css('padding-top')),
      node.offset().top+node.outerHeight()/2)-connect.offset().top);
    }
  });
}
