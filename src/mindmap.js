function abs_sort(val,key) { return Math.abs(key);}
function ideas_to_nodes(json_idea,direction){
  var node_div= $('<div class="node"><span class="label"></span></div>');
  node_div.attr('idea',json_idea.id);
  node_div.children('.label').text(json_idea.title);
  node_div.children('.label').attr('idea',json_idea.id);
  if (json_idea['ideas']){
// group by doesn't keep keys so can't use it here
// var split=_.groupBy(json_idea['ideas'],function(val,key){ return direction||(parseFloat(key)>=0?'right':'left')});
    var split={right:{},left:{}}; 
    _(json_idea.ideas).each(function(value,key){ var grp=direction||(parseFloat(key)>=0?'right':'left'); split[grp][parseFloat(key)]=value;})
    if (_.size(split.right)>0){
      var right_children=$('<div class="children" />').appendTo(node_div);
      _.sortBy(split['right'],abs_sort).forEach(function(idea){ideas_to_nodes(idea,'right').appendTo(right_children)});
    }
    if (_.size(split.left)>0){
      var left_children=$('<div class="children" />').prependTo(node_div);
      _.sortBy(split['left'],abs_sort).forEach(function(idea){ideas_to_nodes(idea,'left').appendTo(left_children)});
    }
  }
  return node_div;
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
function paint_map_connections(jquery_element,connect_classes){
  jquery_element.width(2*widest_child(jquery_element.find('.node:first')));
  $('.node .node .label').each(function(){
    var node=$(this);
    repaint_connection_to_parent(node,connect_classes);
  });
}
function midpoint (jquery_element){
  return {x:jquery_element.offset().left+jquery_element.outerWidth()/2,y:jquery_element.offset().top+jquery_element.outerHeight()/2}
}

function connectClass (node, parent,connect_classes){
  var nodeMid=midpoint(node);
  var parentMid=midpoint(parent);
  if (Math.abs(nodeMid.y,parentMid.y)<Math.min(node.outerHeight(),parent.outerHeight()))
    return connect_classes.horizontal;
  else if (nodeMid.y<parentMid.y && nodeMid.x>parentMid.x) 
    return connect_classes.down_left;
  else if (nodeMid.y>parentMid.y && nodeMid.x>parentMid.x) 
    return connect_classes.up_left;
  else if (nodeMid.y<parentMid.y && nodeMid.x<parentMid.x) 
    return connect_classes.down_right;
  else if (nodeMid.y>parentMid.y && nodeMid.x<parentMid.x) 
    return connect_classes.up_right;
}
function repaint_connection_to_parent(node, connect_classes){
    var vertical_sensitivity_threshold=5;
    var parent=node.parent().parent().parent().children('.label:first');
    if (node.length>0 && parent.length>0){
      var connect= node.siblings('.connect'); //|| won't work, because this is an empty array if nothing
      if (connect.length==0){ connect= $('<div>&nbsp</div>').appendTo(node.parent()); connect.addClass('connect');}
      else connect.removeClass(_.toArray(connect_classes).join(" "));
      var nodeMid=midpoint(node);
      var parentMid=midpoint(parent);
      connect.offset({top:Math.min(nodeMid.y,parentMid.y),left:Math.min(nodeMid.x,parentMid.x)});
      connect.height(Math.max(nodeMid.y,parentMid.y)-connect.offset().top);
      connect.width(Math.max(nodeMid.x,parentMid.x)-connect.offset().left);
      connect.addClass(connectClass(node,parent,connect_classes));    
    }
  }
