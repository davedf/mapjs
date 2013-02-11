/*jslint forin: true, nomen: true*/
/*global _, observable*/
var content = function (contentAggregate) {
	'use strict';
	var init = function (contentIdea) {
		if (contentIdea.ideas) {
			_.each(contentIdea.ideas, function (value, key) {
				contentIdea.ideas[key] = init(value);
			});
		}
		contentIdea.id = contentIdea.id || (contentAggregate.maxId() + 1);
		contentIdea.containsDirectChild = contentIdea.findChildRankById = function (childIdeaId) {
			return parseFloat(
				_.reduce(
					contentIdea.ideas,
					function (res, value, key) {
						return value.id === childIdeaId ? key : res;
					},
					undefined
				)
			);
		};
		contentIdea.findSubIdeaById = function (childIdeaId) {
			var myChild = _.find(contentIdea.ideas, function (idea) {
				return idea.id === childIdeaId;
			});
			return myChild || _.reduce(contentIdea.ideas, function (result, idea) {
				return result || idea.findSubIdeaById(childIdeaId);
			}, undefined);
		};
		contentIdea.find = function (predicate) {
			var current = predicate(contentIdea) ? [_.pick(contentIdea, 'id', 'title')] : [];
			if (_.size(contentIdea.ideas) === 0) {
				return current;
			}
			return _.reduce(contentIdea.ideas, function (result, idea) {
				return _.union(result, idea.find(predicate));
			}, current);
		};
		contentIdea.getStyle = function (name) {
			if (contentIdea.style && contentIdea.style[name]) {
				return contentIdea.style[name];
			}
			return false;
		};
		return contentIdea;
	},
		maxKey = function (kv_map, sign) {
			sign = sign || 1;
			if (_.size(kv_map) === 0) {
				return 0;
			}
			var current_keys = _.keys(kv_map);
			current_keys.push(0); /* ensure at least 0 is there for negative ranks */
			return _.max(_.map(current_keys, parseFloat), function (x) {
				return x * sign;
			});
		},
		nextChildRank = function (parentIdea) {
			var new_rank, counts, childRankSign = 1;
			if (parentIdea.id === contentAggregate.id) {
				counts = _.countBy(parentIdea.ideas, function (v, k) {
					return k < 0;
				});
				if ((counts['true'] || 0) < counts['false']) {
					childRankSign = -1;
				}
			}
			new_rank = maxKey(parentIdea.ideas, childRankSign) + childRankSign;
			return new_rank;
		},
		appendSubIdea = function (parentIdea, subIdea) {
			parentIdea.ideas = parentIdea.ideas || {};

			parentIdea.ideas[nextChildRank(parentIdea)] = subIdea;
		},
		findIdeaById = function (ideaId) {
			ideaId = parseFloat(ideaId);
			return contentAggregate.id === ideaId ? contentAggregate : contentAggregate.findSubIdeaById(ideaId);
		},
		sameSideSiblingRanks = function (parentIdea, ideaRank) {
			return _(_.map(_.keys(parentIdea.ideas), parseFloat)).reject(function (k) {return k * ideaRank < 0; });
		},
		traverseAndRemoveIdea = function (parentIdea, subIdeaId) {
			var deleted, childRank = parentIdea.findChildRankById(subIdeaId);
			if (childRank) {
				deleted = parentIdea.ideas[childRank];
				delete parentIdea.ideas[childRank];
				return deleted;
			}
			return _.reduce(
				parentIdea.ideas,
				function (result, child) {
					return result || traverseAndRemoveIdea(child, subIdeaId);
				},
				false
			);
		},
		sign = function (number) {
			/* intentionally not returning 0 case, to help with split sorting into 2 groups */
			return number < 0 ? -1 : 1;
		};
	contentAggregate.maxId = function maxId(idea) {
		idea = idea || contentAggregate;
		if (!idea.ideas) {
			return idea.id || 0;
		}
		return _.reduce(
			idea.ideas,
			function (result, subidea) {
				return Math.max(result, maxId(subidea));
			},
			idea.id || 0
		);
	};
	contentAggregate.nextSiblingId = function (subIdeaId) {
		var parentIdea = contentAggregate.findParent(subIdeaId),
			currentRank,
			candidateSiblingRanks,
			siblingsAfter;
		if (!parentIdea) { return false; }
		currentRank = parentIdea.findChildRankById(subIdeaId);
		candidateSiblingRanks = sameSideSiblingRanks(parentIdea, currentRank);
		siblingsAfter = _.reject(candidateSiblingRanks, function (k) { return Math.abs(k) <= Math.abs(currentRank); });
		if (siblingsAfter.length === 0) { return false; }
		return parentIdea.ideas[_.min(siblingsAfter, Math.abs)].id;
	};
	contentAggregate.previousSiblingId = function (subIdeaId) {
		var parentIdea = contentAggregate.findParent(subIdeaId),
			currentRank,
			candidateSiblingRanks,
			siblingsBefore;
		if (!parentIdea) { return false; }
		currentRank = parentIdea.findChildRankById(subIdeaId);
		candidateSiblingRanks = sameSideSiblingRanks(parentIdea, currentRank);
		siblingsBefore = _.reject(candidateSiblingRanks, function (k) { return Math.abs(k) >= Math.abs(currentRank); });
		if (siblingsBefore.length === 0) { return false; }
		return parentIdea.ideas[_.max(siblingsBefore, Math.abs)].id;
	};


	/*** private utility methods ***/
	contentAggregate.findParent = function (subIdeaId, parentIdea) {
		parentIdea = parentIdea || contentAggregate;
		var childRank = parentIdea.findChildRankById(subIdeaId);
		if (childRank) {
			return parentIdea;
		}
		return _.reduce(
			parentIdea.ideas,
			function (result, child) {
				return result || contentAggregate.findParent(subIdeaId, child);
			},
			false
		);
	};

	/**** aggregate command processing methods ****/
	contentAggregate.flip = function (ideaId) {
		var new_rank, max_rank, current_rank = contentAggregate.findChildRankById(ideaId);
		if (!current_rank) {
			return false;
		}
		max_rank = maxKey(contentAggregate.ideas, -1 * sign(current_rank));
		new_rank = max_rank - 10 * sign(current_rank);
		contentAggregate.ideas[new_rank] = contentAggregate.ideas[current_rank];
		delete contentAggregate.ideas[current_rank];
		contentAggregate.dispatchEvent('changed', 'flip', [ideaId]);
		return true;
	};
	contentAggregate.updateTitle = function (ideaId, title) {
		var idea = findIdeaById(ideaId);
		if (!idea) {
			return false;
		}
		idea.title = title;
		contentAggregate.dispatchEvent('changed', 'updateTitle', [ideaId, title]);
		return true;
	};
	contentAggregate.addSubIdea = function (parentId, ideaTitle) {
		var idea, parent = findIdeaById(parentId);
		if (!parent) {
			return false;
		}
		idea = init({
			title: ideaTitle
		});
		appendSubIdea(parent, idea);
		contentAggregate.dispatchEvent('changed', 'addSubIdea', [parentId, ideaTitle, idea.id]);
		return true;
	};
	contentAggregate.removeSubIdea = function (subIdeaId) {
		var result = traverseAndRemoveIdea(contentAggregate, subIdeaId);
		if (result) {
			contentAggregate.dispatchEvent('changed', 'removeSubIdea', [subIdeaId]);
		}
		return result;
	};
	contentAggregate.insertIntermediate = function (inFrontOfIdeaId, title) {
		if (contentAggregate.id === inFrontOfIdeaId) {
			return false;
		}
		var childRank, oldIdea, newIdea, parentIdea = contentAggregate.findParent(inFrontOfIdeaId);
		if (!parentIdea) {
			return false;
		}
		childRank = parentIdea.findChildRankById(inFrontOfIdeaId);
		if (!childRank) {
			return false;
		}
		oldIdea = parentIdea.ideas[childRank];
		newIdea = init({
			title: title
		});
		parentIdea.ideas[childRank] = newIdea;
		newIdea.ideas = {
			1: oldIdea
		};
		contentAggregate.dispatchEvent('changed', 'insertIntermediate', [inFrontOfIdeaId, title, newIdea.id]);
		return true;
	};
	contentAggregate.changeParent = function (ideaId, newParentId) {
		if (ideaId === newParentId) {
			return false;
		}
		var idea, parent = findIdeaById(newParentId);
		if (!parent) {
			return false;
		}
		idea = contentAggregate.findSubIdeaById(ideaId);
		if (!idea) {
			return false;
		}
		if (idea.findSubIdeaById(newParentId)) {
			return false;
		}
		if (parent.containsDirectChild(ideaId)) {
			return false;
		}
		traverseAndRemoveIdea(contentAggregate, ideaId);
		if (!idea) {
			return false;
		}
		appendSubIdea(parent, idea);
		contentAggregate.dispatchEvent('changed', 'changeParent', [ideaId, newParentId]);
		return true;
	};
	contentAggregate.updateStyle = function (ideaId, styleName, styleValue) {
		var idea = findIdeaById(ideaId);
		if (!idea) {
			return false;
		}
		idea.style = idea.style || {};
		if (styleValue) {
			idea.style[styleName] = styleValue;
		} else {
			delete idea.style[styleName];
		}
		if (_.size(idea.style) === 0) {
			delete idea.style;
		}
		contentAggregate.dispatchEvent('changed', 'updateStyle', [ideaId, styleName, styleValue]);
		return true;
	};
	contentAggregate.positionBefore = function (ideaId, positionBeforeIdeaId, parentIdea) {
		parentIdea = parentIdea || contentAggregate;
		var new_rank, after_rank, sibling_ranks, candidate_siblings, before_rank, max_rank, current_rank;
		current_rank = parentIdea.findChildRankById(ideaId);
		if (!current_rank) {
			return _.reduce(
				parentIdea.ideas,
				function (result, idea) {
					return result || contentAggregate.positionBefore(ideaId, positionBeforeIdeaId, idea);
				},
				false
			);
		}
		if (ideaId === positionBeforeIdeaId) {
			return false;
		}
		new_rank = 0;
		if (positionBeforeIdeaId) {
			after_rank = parentIdea.findChildRankById(positionBeforeIdeaId);
			if (!after_rank) {
				return false;
			}
			sibling_ranks = sameSideSiblingRanks(parentIdea, current_rank);
			candidate_siblings = _.reject(_.sortBy(sibling_ranks, Math.abs), function (k) {
				return Math.abs(k) >= Math.abs(after_rank);
			});
			before_rank = candidate_siblings.length > 0 ? _.max(candidate_siblings) : 0;
			if (before_rank === current_rank) {
				return false;
			}
			new_rank = before_rank + (after_rank - before_rank) / 2;
		} else {
			max_rank = maxKey(parentIdea.ideas, current_rank < 0 ? -1 : 1);
			if (max_rank === current_rank) {
				return false;
			}
			new_rank = max_rank + 10 * (current_rank < 0 ? -1 : 1);
		}
		if (new_rank === current_rank) {
			return false;
		}
		parentIdea.ideas[new_rank] = parentIdea.ideas[current_rank];
		delete parentIdea.ideas[current_rank];
		contentAggregate.dispatchEvent('changed', 'positionBefore', [ideaId, positionBeforeIdeaId]);
		return true;
	};
	init(contentAggregate);
	return observable(contentAggregate);
};
