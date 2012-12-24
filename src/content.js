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

