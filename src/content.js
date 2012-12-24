function content(base){
  if (base.ideas) _.each(base.ideas, function(value,key){base.ideas[key]=content(value)});
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

