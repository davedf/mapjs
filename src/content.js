function max_id(idea){
  if (!idea.ideas) return idea.id||0;
  return _.reduce(idea.ideas,function(result, subidea){return Math.max(result,max_id(subidea))},idea.id||0);
}

function content(base, idprovider){
  var incremental_counter={
    current:max_id(base),
    next:function(){
      return ++incremental_counter.current;
    }  
  };
  var local_id_generator=idprovider||incremental_counter;
  if (base.ideas) _.each(base.ideas, function(value,key){base.ideas[key]=content(value,local_id_generator)});
  if (! base.id) { base.id=local_id_generator.next(); }
  return $.extend(observable(base), {
    set_title: function(new_title){
      base.title=new_title;
      base.dispatchEvent('Title_Updated', base);
    }
  });
}

function cmd_update_title(content_idea,target_id,new_title){
  if (content_idea.id==target_id) {
      content_idea.set_title(new_title);
      return true;
  }
  else return _.reduce(content_idea.ideas,function(result,idea){return result||cmd_update_title(idea,target_id,new_title)},false);
}
function find_child_rank_by_id(parent_idea,child_id){
  return _.reduce(parent_idea.ideas, function(res, value,key) { if (value.id==child_id) return key; else return res; }, undefined);
}
function cmd_reorder(parent_idea, child_id_to_reorder, target_id_after){
  var current_rank=find_child_rank_by_id(parent_idea,child_id_to_reorder );
  if (!current_rank) return false;
  if (child_id_to_reorder==target_id_after) return true;
  var new_rank=0;
  if (target_id_after){
    var after_rank=parseFloat(find_child_rank_by_id(parent_idea,target_id_after));
    var ranks_before=_(_(_(_(parent_idea.ideas).keys()).map(parseFloat)).sortBy(function(k){return Math.abs(k)})).reject(function(k){return Math.abs(k)>=Math.abs(after_rank)});
    var before_rank=ranks_before.length>0?_.max(ranks_before):0;
    if (before_rank==current_rank) return true;
    new_rank=before_rank+(after_rank-before_rank)/2;
  }
  else {
    var max_rank=_(_(_(_(parent_idea.ideas).keys()).map(parseFloat))).max(Math.abs);
    if (max_rank==current_rank) return true;
    new_rank=max_rank+10*(current_rank<0?-1:1);
  }
  parent_idea.ideas[new_rank]=parent_idea.ideas[current_rank];
  delete parent_idea.ideas[current_rank];
  return true;
}
