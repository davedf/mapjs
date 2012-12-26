var content;

(function () {
  content = function (contentAggregate) {
    var init = function (contentIdea) {
      if (contentIdea.ideas)
        _.each(contentIdea.ideas, function (value, key) {
          contentIdea.ideas[key] = init(value);
        });
      contentIdea.id = contentIdea.id || (contentAggregate.maxId() + 1);
      contentIdea.findChildRankById = function (childIdeaId) {
        return parseFloat(_.reduce(
          contentIdea.ideas, 
          function(res, value, key) { 
            return value.id == childIdeaId ? key : res;
          },
          undefined
        ));
      }
      return contentIdea;
    };
    contentAggregate.maxId = function maxId(idea) {
      idea = idea || contentAggregate;
      if (!idea.ideas)
        return idea.id || 0;
      return _.reduce(
        idea.ideas,
        function (result, subidea){
          return Math.max(result, maxId(subidea));
        },
        idea.id || 0
      );
    };
    contentAggregate.updateTitle = function (ideaId, title) {
      var contentIdea = arguments[2] || contentAggregate;
      if (contentIdea.id == ideaId) {
          contentIdea.title = title;
          contentAggregate.dispatchEvent('Title_Updated', contentIdea);
          return true;
      } else
        return _.reduce(
          contentIdea.ideas,
          function(result, idea) {
            return result || contentAggregate.updateTitle(ideaId, title, idea);
          },
          false
        );
    };
    maxAbsoluteNumKey=function(kv_map){
      if (_.size(kv_map)==0) return 0;
     return _(_(_(_(kv_map).keys()).map(parseFloat))).max(Math.abs);
    }
    
    traverseAndAddIdeaToParent = function(current, parentId, newIdea ) {
      if (current.id==parentId){
        if (!current.ideas) current.ideas={}
        current.ideas[Math.abs(maxAbsoluteNumKey(current.ideas))+1]=newIdea;
        return true;
      }
      return _.reduce(
        current.ideas,
        function (result, child) {
          return result || traverseAndAddIdeaToParent(child,parentId, newIdea);
        },
        false
      );
    }
    contentAggregate.addSubIdea = function(parentId,ideaTitle){
      var newIdea=init({title:ideaTitle,id:contentAggregate.maxId()+1});
      var result=traverseAndAddIdeaToParent(contentAggregate,parentId,newIdea);
      if (result) contentAggregate.dispatchEvent('Idea_Added',newIdea);
      return result;
    }
    traverseAndRemoveIdea = function (parentIdea,subIdeaId) {
      var childRank=parentIdea.findChildRankById(subIdeaId);
      if (childRank){
        var deleted= parentIdea.ideas[childRank];
        delete parentIdea.ideas[childRank];
        return deleted;
      }
      return _.reduce(
        parentIdea.ideas,
        function (result, child) {
          return result || traverseAndRemoveIdea(child,subIdeaId);
        },
        false
      );
    }
    contentAggregate.removeSubIdea = function (subIdeaId){
      var result= traverseAndRemoveIdea(contentAggregate,subIdeaId);
      if (result)  contentAggregate.dispatchEvent('Idea_Removed',subIdeaId);
      return result;
    }
    contentAggregate.changeParent = function (ideaId, newParentId){
      var idea=traverseAndRemoveIdea(contentAggregate,ideaId);
      if (!idea) return false;
      var result= traverseAndAddIdeaToParent(contentAggregate,newParentId,idea);
      if (result) { 
        contentAggregate.dispatchEvent('Parent_Changed',ideaId);
      }
      return result;
    }
    contentAggregate.positionBefore = function (ideaId, positionBeforeIdeaId) {
      var parentIdea = arguments[2] || contentAggregate;
      var current_rank=parentIdea.findChildRankById(ideaId);
      if (!current_rank)  
        return _.reduce(
          parentIdea.ideas,
          function (result, idea) {
            return result || contentAggregate.positionBefore(ideaId, positionBeforeIdeaId, idea)
          },
          false
        );
      if (ideaId == positionBeforeIdeaId)
        return true; 
      var new_rank = 0;
      if (positionBeforeIdeaId) {
        var after_rank = parentIdea.findChildRankById(positionBeforeIdeaId);
        var ranks_before = _(
          _(
            _(_(parentIdea.ideas).keys())
            .map(parseFloat)
          ).sortBy(function (k) {
            return Math.abs(k);
          })
        ).reject(function (k) {
          return Math.abs(k) >= Math.abs(after_rank);
        });
        var before_rank = ranks_before.length > 0 ? _.max(ranks_before) : 0;
        if (before_rank == current_rank)
          return true;
        new_rank = before_rank + (after_rank - before_rank) / 2;
      } else {
        var max_rank = maxAbsoluteNumKey(parentIdea.ideas); 
        if (max_rank == current_rank)
          return true;
        new_rank = max_rank + 10 * (current_rank < 0 ? -1 : 1);
      }
      parentIdea.ideas[new_rank] = parentIdea.ideas[current_rank];
      delete parentIdea.ideas[current_rank];
      contentAggregate.dispatchEvent('Child_Ranks_Changed',parentIdea);
      return true;
    }
    init(contentAggregate);
    return observable(contentAggregate);
  }
})();
