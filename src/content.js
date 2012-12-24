function content(base){
  if (base.ideas) _.each(base.ideas, function(value,key){base.ideas[key]=content(value)});
  return $.extend(observable(base), {
    set_title: function(new_title){
      base.title=new_title;
      base.dispatchEvent('Title_Updated', base);
    }
  });
}

