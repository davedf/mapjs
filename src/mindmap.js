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
function mapDiff(start,target){
  var result={moved:[], resized:[], renamed:[]};
  var startNodes=start.nodes||{}
  var targetNodes=target.nodes||{}
  _.each(start.nodes,function(oldNode,id){ 
    var targetNode=targetNodes[id]; 
    if (targetNode) {
      if (!_.isEqual(oldNode.offset,targetNode.offset)) result.moved.push (id); 
      if (!_.isEqual(oldNode.dimensions,targetNode.dimensions)) result.resized.push (id); 
      if (!(oldNode.text===targetNode.text)) result.renamed.push(id);
    }
  });
  result.added=_.difference(_.keys(targetNodes), _.keys(startNodes));
  result.deleted=_.difference(_.keys(startNodes), _.keys(targetNodes));
  result.connected= _.reject(target.connectors, function(connector){return _.some(start.connectors, function(val) { return _.isEqual(connector,val) })})
  result.disconnected= _.reject(start.connectors, function(connector){return _.some(target.connectors, function(val) { return _.isEqual(connector,val) })})
  return result;
}
function addNode(jquery_map_container,id, map_node){
  label=$("<span class='label'></span>");
  label.attr('idea',id);
  label.css('position','absolute');
  label.css('top',map_node.offset.top);
  label.css('left',map_node.offset.left);
  label.css('width',map_node.dimensions.width);
  label.css('height',map_node.dimensions.height);
  label.text(map_node.text);
  label.appendTo(jquery_map_container);
  label.hide();
  return label;
}
function addConnector(jquery_map_container,fromId,from,toId,to){
  var connect= jquery_map_container.find('.connect[from='+fromId+'][to='+toId+']');
  if (connect.length==0){ 
    connect= $('<div>&nbsp</div>').appendTo(jquery_map_container); 
    connect.addClass('connect');
    connect.attr('from',fromId);
    connect.attr('to', toId);
  }
  connect.removeClass(_.toArray(connect_classes).join(" "));
  var nodeMid=midpoint(from)
  var targetMid=midpoint(to);
  var connectTop=Math.min(nodeMid.y,targetMid.y);
  var connectLeft=Math.min(nodeMid.x,targetMid.x);
  connect.css('top',connectTop);
  connect.css('left',connectLeft);
  connect.height(Math.max(nodeMid.y,targetMid.y)-connectTop);
  connect.width(Math.max(nodeMid.x,targetMid.x)-connectLeft);
  connect.addClass(connectClass(nodeMid,targetMid,from.dimensions.height,to.dimensions.height));    
  return connect;
}
function repositionConnectorFromJq(jquery_map_container,connect){
  var from=jquery_map_container.find('.label[idea='+connect.attr('from')+']'); 
  var to=jquery_map_container.find('.label[idea='+connect.attr('to')+']'); 
  connect.removeClass(_.toArray(connect_classes).join(" "));
  var nodeMid=midpoint_jq_rel(from)
  var targetMid=midpoint_jq_rel(to);
  var connectTop=Math.min(nodeMid.y,targetMid.y);
  var connectLeft=Math.min(nodeMid.x,targetMid.x);
  connect.css('top',connectTop);
  connect.css('left',connectLeft);
  connect.height(Math.max(nodeMid.y,targetMid.y)-connectTop);
  connect.width(Math.max(nodeMid.x,targetMid.x)-connectLeft);
  connect.addClass(connectClass(nodeMid,targetMid,from.height(),to.height()));    
  return connect;
}

function delayedShow(label, callback){
  return function(){ label.fadeIn(100,callback) };
}
function delayedMove(label, css_props, callback,stepCallback){
  return function(){ label.animate(css_props,{duration:200,complete:callback,step:stepCallback}) };
}
function delayedLabelRename(jquery_map_container,title,index,callback){
    var label=jquery_map_container.find('.label[idea='+index+']');
    return function(){
      label.text(title);
      if (callback) callback();
    }
}
function delayedLabelCssAnimation(jquery_map_container, css_props,index, map_object, callback){
    var label=jquery_map_container.find('.label[idea='+index+']');
    return delayedMove(label,css_props,callback,
    function(now,fx){
        updateConnectors(jquery_map_container,index,fx.elem,map_object) 
      }
    );
}
function delayedHide(element, callback){
  return function(){ element.fadeOut(100,function(){ element.detach();callback();}) };
}

function updateConnectors(jquery_map_container,nodeIdx,nodeCurrentElement,map_object){
  var changed_connectors=map_object.connectors.filter(function(v){return v.from==nodeIdx||v.to==nodeIdx;})
  _.each(changed_connectors, function(connector){
    repositionConnectorFromJq(jquery_map_container,
      jquery_map_container.find('.connect[from='+connector.from+'][to='+connector.to+']'));
  });
}
function update_map(jquery_map_container, map_object){
  var existing_map=visual_to_damjan(jquery_map_container);
  var diff=mapDiff(existing_map,map_object);
  var effectChain=undefined;
  for(var idx in diff.connected){
    var connector=addConnector(
      jquery_map_container,
      diff.connected[idx].from,
      map_object.nodes[diff.connected[idx].from],
      diff.connected[idx].to,
      map_object.nodes[diff.connected[idx].to]);
      connector.hide();
      effectChain=delayedShow(connector,effectChain);
  }
  for(var idx in diff.added){
    var label=addNode(jquery_map_container,diff.added[idx],map_object.nodes[diff.added[idx]]); 
    effectChain=delayedShow(label,effectChain);
  };
  for(var idx in diff.moved){
    effectChain=delayedLabelCssAnimation(jquery_map_container,map_object.nodes[diff.moved[idx]].offset,diff.moved[idx], map_object, effectChain);
  }
  for ( var idx in diff.renamed){
    effectChain=delayedLabelRename(jquery_map_container,map_object.nodes[diff.renamed[idx]].text,diff.renamed[idx],effectChain);
  }
  for (var idx in diff.resized){
    effectChain=delayedLabelCssAnimation(jquery_map_container,map_object.nodes[diff.resized[idx]].dimensions,diff.resized[idx], map_object, effectChain);
  }


  for(var idx in diff.deleted){
      var label= jquery_map_container.find('.label[idea='+diff.deleted[idx]+']'); 
      effectChain=delayedHide(label,effectChain);
  }
  for(var idx in diff.disconnected){
      var connector= jquery_map_container.find('.connect[from='+diff.disconnected[idx].from+'][to='+diff.disconnected[idx].to+']'); 
      effectChain=delayedHide(connector,effectChain);
  }
  //renamed
  //resized
  effectChain();
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
function midpoint (node){
  return {x:node.offset.left+node.dimensions.width/2,y:node.offset.top+node.dimensions.height/2}
}
function midpoint_jq (jquery_element){
  return {x:jquery_element.offset().left+jquery_element.outerWidth()/2,y:jquery_element.offset().top+jquery_element.outerHeight()/2}
}
function midpoint_jq_rel (jquery_element){
  return {x:jquery_element.position().left+jquery_element.width()/2,y:jquery_element.position().top+jquery_element.height()/2}
}
var connect_classes={
  horizontal: "connect_horizontal",
  down_left: "connect_down_left",
  up_left: "connect_up_left",
  down_right: "connect_down_right",
  up_right: "connect_up_right"
};
function connectClass (nodeMid, targetMid, nodeHeight, targetHeight){
  if (Math.abs(nodeMid.y-targetMid.y)<Math.min(nodeHeight,targetHeight)/2)
    return connect_classes.horizontal;
  else if (nodeMid.y<targetMid.y && nodeMid.x>targetMid.x) 
    return connect_classes.down_left;
  else if (nodeMid.y>targetMid.y && nodeMid.x>targetMid.x) 
    return connect_classes.up_left;
  else if (nodeMid.y<targetMid.y && nodeMid.x<targetMid.x) 
    return connect_classes.down_right;
  else if (nodeMid.y>targetMid.y && nodeMid.x<targetMid.x) 
    return connect_classes.up_right;
}
function repaint_connection_to_parent(node){
    var parent=node.parent().parent().parent().children('.label:first');
    connectNodes(node, parent);
}
function connectNodes(node, target){
    if (node.length>0 && target.length>0){
      var connect= node.siblings('.connect[from='+node.attr('idea')+'][to='+target.attr('idea')+']'); //|| won't work, because this is an empty array if nothing
      if (connect.length==0){ 
        connect= $('<div>&nbsp</div>').appendTo(node.parent()); 
        connect.addClass('connect');
        connect.attr('from',node.attr('idea'));
        connect.attr('to', target.attr('idea'));
      }
      else connect.removeClass(_.toArray(connect_classes).join(" "));
      var nodeMid=midpoint_jq(node);
      var targetMid=midpoint_jq(target);
      connect.offset({top:Math.min(nodeMid.y,targetMid.y),left:Math.min(nodeMid.x,targetMid.x)});
      connect.height(Math.max(nodeMid.y,targetMid.y)-connect.offset().top);
      connect.width(Math.max(nodeMid.x,targetMid.x)-connect.offset().left);
      connect.addClass(connectClass(nodeMid,targetMid,node.outerHeight(),target.outerHeight()));    
      return connect;
    }
  }
function visual_to_damjan(jquery_map_root){
  var result={nodes:{}, connectors:[]}
  _.each(jquery_map_root.find('.label'),function(element){ 
      result.nodes[$(element).attr('idea')]= { 
          offset: $(element).position(), 
          dimensions: {width:$(element).width(),height:$(element).height()}, 
          text:$(element).text() 
      };  
  });
  _.each(jquery_map_root.find('.connect'),function(element){ 
      result.connectors.push( { from: $(element).attr('from'), to: $(element).attr('to') });
  });  
  return result;
}
