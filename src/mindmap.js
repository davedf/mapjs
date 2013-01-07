
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
/* dom positioning */
function abs_sort(val,key) { return Math.abs(key);}
function widest_child(jquery_elem){
  var childNodes=jquery_elem.children('.children').children('.node');
  if ( childNodes.length==0) return jquery_elem.outerWidth(true);
  var max=0;
  _.each(childNodes,function(node){
    var current=widest_child($(node));
    if (max<current) max=current;
  });
  return jquery_elem.children('.MAP_label').outerWidth(true)+max+
         jquery_elem.outerWidth(true)-jquery_elem.width();
}
function midpoint_jq_rel (jquery_element){
  return {x:jquery_element.position().left+jquery_element.outerWidth()/2,y:jquery_element.position().top+jquery_element.outerHeight()/2}
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
function ideas_to_nodes(json_idea,direction){
  var node_div= $('<div class="node"><span class="MAP_label"></span></div>');
  node_div.attr('idea',json_idea.id);
  node_div.children('.MAP_label').text(json_idea.title);
  node_div.children('.MAP_label').attr('idea',json_idea.id);
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
function findOrCreateConnector(jquery_map_container, fromId, toId){
  var connect= jquery_map_container.find('.connect[from='+fromId+'][to='+toId+']');
  if (connect.length==0){ 
    connect= $('<div>&nbsp</div>').appendTo(jquery_map_container); 
    connect.addClass('connect');
    connect.attr('from',fromId);
    connect.attr('to', toId);
  }
  return connect;
}
function repositionConnectorFromJq(jquery_map_container,connect){
  var from=jquery_map_container.find('.MAP_label[idea='+connect.attr('from')+']'); 
  var to=jquery_map_container.find('.MAP_label[idea='+connect.attr('to')+']'); 
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

function paint_map_connections(jquery_element){
  var required_width=3*widest_child(jquery_element.find('.node:first'));
  jquery_element.width(required_width);
  _.each($('.node .node .MAP_label'),function(node){
    repaint_connection_to_parent(jquery_element,$(node));
  });
}

function repaint_connection_to_parent(jquery_map_container,node){
    var parent=node.parent().parent().parent().children('.MAP_label:first');
    if (node.length>0 && parent.length>0){
      var connect=findOrCreateConnector(jquery_map_container, node.attr('idea'), parent.attr('idea'));
      repositionConnectorFromJq(jquery_map_container,connect)
    }
  }
function dom_repaint_entire_map(active_content, jquery_map, onComplete){
  jquery_map.children().detach();
  ideas_to_nodes(active_content).appendTo(jquery_map);
  paint_map_connections(jquery_map);
  if (onComplete) onComplete();
}
function updateConnectorsJq(jquery_map_container,nodeIdx){
  var changed_connectors=jquery_map_container.find('.connect[from='+nodeIdx+']').add(jquery_map_container.find('.connect[to='+nodeIdx+']'));
  _.each(changed_connectors, function(connector){ repositionConnectorFromJq(jquery_map_container, $(connector) )});
}
/* jquery painting */
function addNode(jquery_map_container,id, map_node){
  label=$("<span class='MAP_label'></span>");
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

function delayedShow(label, callback){
  return function(){ label.fadeIn(100,callback) };
}
function delayedMove(label, css_props, callback,stepCallback){
  return function(){ label.animate(css_props,{duration:200,complete:callback,step:stepCallback}) };
}
function delayedLabelRename(jquery_map_container,title,index,callback){
    var label=jquery_map_container.find('.MAP_label[idea='+index+']');
    return function(){
      label.text(title);
      if (callback) callback();
    }
}
function delayedLabelCssAnimation(jquery_map_container, css_props,index, map_object, callback){
    var label=jquery_map_container.find('.MAP_label[idea='+index+']');
    return delayedMove(label,css_props,callback,
    function(now,fx){
        updateConnectorsJq(jquery_map_container,index,fx.elem,map_object) 
      }
    );
}
function delayedHide(element, callback){
  return function(){ element.fadeOut(100,function(){ element.detach();if (callback) callback();}) };
}

function delayedConnect(jquery_map_container,fromId, toId, callBack){
  return function(){ 
    var connect=findOrCreateConnector(jquery_map_container, fromId, toId);
    repositionConnectorFromJq(jquery_map_container,connect)
    connect.hide();
    connect.fadeIn(100,callBack) 
  };
}
function visual_to_map(jquery_map_root){
  var result={nodes:{}, connectors:[]}
  _.each(jquery_map_root.find('.MAP_label'),function(element){ 
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
function update_map(jquery_map_container, map_object,callback){
  var existing_map=visual_to_map(jquery_map_container);
  var diff=mapDiff(existing_map,map_object);
  var effectChain=callback;
  for(var idx in diff.connected){
      effectChain=delayedConnect(jquery_map_container, diff.connected[idx].from, diff.connected[idx].to, effectChain);
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
      var label= jquery_map_container.find('.MAP_label[idea='+diff.deleted[idx]+']'); 
      effectChain=delayedHide(label,effectChain);
  }
  for(var idx in diff.disconnected){
      var connector= jquery_map_container.find('.connect[from='+diff.disconnected[idx].from+'][to='+diff.disconnected[idx].to+']'); 
      effectChain=delayedHide(connector,effectChain);
  }
  effectChain();
}




/* generic (DOM/Jquery) event handling */
function above(referenceElement,aboveElement){
  return referenceElement.offset().top+referenceElement.outerHeight()/2>aboveElement.offset().top+aboveElement.outerHeight()/2;
}
function onSameSide(firstElement, secondElement, referenceElement){
  return (referenceElement.offset().left-firstElement.offset().left)*
         (referenceElement.offset().left-secondElement.offset().left)>0;
}
var defaultClasses={ hoverClass:'hover',activeClass:'active',selectedClass:'selected'} 
function attach_label_listeners(jquery_label,jquery_map,ideas,options){
  options=$.extend({},defaultClasses,options); 
  var oldPos,oldOffset; 
  jquery_label.draggable({
    drag: function(event,ui){
      updateConnectorsJq(jquery_map,ui.helper.attr('idea'));
    },
    start: function(event,ui){
      oldPos=ui.helper.position();
      oldOffset=ui.helper.offset(); 
    },
    stop: function(event,ui){
      var nodeId=ui.helper.attr('idea');
      var parentConnector=jquery_map.find('.connect[from='+nodeId+']');
      var parentId=parentConnector.attr('to');
      var parent_label=jquery_map.find('.MAP_label[idea='+parentId+']');
      var result;
      if (onSameSide(ui.helper,{offset:function(){return oldOffset}},parent_label)){
        var siblingConnectors=jquery_map.find('.connect[to='+parentId+']');
        var sibling_labels=_.map(siblingConnectors, function(connector){
          return jquery_map.find('.MAP_label[idea='+$(connector).attr('from')+']');
        });
        var groups= _.groupBy(sibling_labels,function(item){ return onSameSide(item,ui.helper,parent_label) && above(item,ui.helper)});
        var firstBelowId=$(_.min(groups[true], function(label_span) { return label_span.offset().top })).attr('idea');
        result=ideas.positionBefore(nodeId,firstBelowId);
      }
      else
        result=ideas.flip(nodeId);
      if (!result){
        ui.helper.animate(ui.helper.css('position')=='relative'?{top:0,left:0}:oldPos,{
          duration:200,
          step:function(){
            updateConnectorsJq(jquery_map,nodeId);
          }
        });
      }
    }
  });
  jquery_label.droppable({
    accept: ".MAP_label",
    activeClass: options.activeClass,
    hoverClass: options.hoverClass,
    drop: function(event,ui){
      var newParent= $(event.target).attr('idea');
      var ideaId= $(ui.helper).attr('idea');
      ideas.changeParent(ideaId,newParent);
    }
  });
  jquery_label.dblclick(function(){
    var ideaId=$(this).attr('idea');
    editLabel(this, function(newValue){
      ideas.updateTitle(ideaId,newValue);
    });
  });
  jquery_label.click(function(event){
    jquery_map.find('.'+options.selectedClass).removeClass(options.selectedClass);
    $(event.target).addClass(options.selectedClass)
  });
}
function editLabel(labelElement,callback){
  var originalText=$(labelElement).text();
  var originalLabel=$(labelElement);
  var dim={height: $(labelElement).innerHeight(), width: $(labelElement).innerWidth()};
  $(labelElement).text("");
  var ta=$("<textarea>"+originalText+"</textarea>").appendTo($(labelElement));
  ta.height(dim.height); ta.width(dim.width);
  ta.focus();
  ta.blur(function(){
    var newVal=ta.val();
    callback(newVal);
  });
  ta.keydown(function(e){
    if (e.keyCode==13){ //ENTER
      var newVal=ta.val();
      e.stopPropagation();
      callback(newVal);
    }
    else if (e.keyCode==27){
      originalLabel.text(originalText); 
      ta.detach();
      e.stopPropagation();
    }
  });
}
function attach_map_listeners(content_aggregate,jquery_map, repaint_callback,options){
  options=$.extend({},defaultClasses,options); 
  content_aggregate.addEventListener('positionBefore', function(){
    repaint_callback(content_aggregate,jquery_map);
  });
  content_aggregate.addEventListener('updateTitle', function(ideaId, newTitle){
    repaint_callback(content_aggregate,jquery_map);
  });
  content_aggregate.addEventListener('addSubIdea', function(parentIdea,title,newIdeaId){
    repaint_callback(content_aggregate,jquery_map, function(){
    jquery_map.find('.'+options.selectedClass).removeClass(options.selectedClass);
    var newLabel=jquery_map.find('.MAP_label[idea='+newIdeaId+']');
    newLabel.effect('bounce',{},500,function(){
      newLabel.addClass(options.selectedClass)
      attach_label_listeners(newLabel, jquery_map,content_aggregate,options);
    });
    });
  });
  content_aggregate.addEventListener('removeSubIdea', function(ideaId){
    repaint_callback(content_aggregate,jquery_map);
  });
  content_aggregate.addEventListener('changeParent', function(ideaId,parentId){
    repaint_callback(content_aggregate,jquery_map);
  });
  content_aggregate.addEventListener('flip', function(ideaId,parentId){
    repaint_callback(content_aggregate,jquery_map);
  });
  $(document).keydown(function(e) {

    var selectedId=jquery_map.find('.'+options.selectedClass).attr('idea');
    if (!selectedId) return;
    if(e.which == 13) {// ENTER
      content_aggregate.addSubIdea(selectedId,'A cunning plan');
      e.stopPropagation();
    }
    if(e.which == 8) { // BACKSPACE
      content_aggregate.removeSubIdea(selectedId);
      e.preventDefault();
      e.stopPropagation();
    } 
  });
}

