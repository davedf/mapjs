function abs_sort(val,key) { return Math.abs(key);}
function attach_listeners(content_idea,node_div){
    content_idea.addEventListener('Title_Updated', function(idea){ 
      node_div.children('.label').text(idea.title);
    });
}
function ideas_to_nodes(json_idea,direction){
  var node_div= $('<div class="node"><span class="label">'+json_idea.title+'</span></div>');
  if (json_idea['ideas']){
    var split=_.groupBy(json_idea['ideas'],function(val,key){ return direction||(parseFloat(key)>=0?'right':'left')});
    if (split['right']){
      var right_children=$('<div class="children" />').appendTo(node_div);
      _.sortBy(split['right'],abs_sort).forEach(function(idea){ideas_to_nodes(idea,'right').appendTo(right_children)});
    }
    if (split['left']){
      var left_children=$('<div class="children" />').prependTo(node_div);
      _.sortBy(split['left'],abs_sort).forEach(function(idea){ideas_to_nodes(idea,'left').appendTo(left_children)});
    }
  }
  if (json_idea.addEventListener) {attach_listeners(json_idea,node_div);}
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
