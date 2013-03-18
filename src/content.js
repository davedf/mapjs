/*jslint eqeq: true, forin: true, nomen: true*/
/*global _, observable*/
var content = function (contentAggregate, progressCallback) {
	'use strict';
	var init = function (contentIdea) {
		if (contentIdea.ideas) {
			_.each(contentIdea.ideas, function (value, key) {
				contentIdea.ideas[parseFloat(key)] = init(value);
			});
		}
		contentIdea.id = contentIdea.id || contentAggregate.nextId();
		contentIdea.containsDirectChild = contentIdea.findChildRankById = function (childIdeaId) {
			return parseFloat(
				_.reduce(
					contentIdea.ideas,
					function (res, value, key) {
						return value.id == childIdeaId ? key : res;
					},
					undefined
				)
			);
		};
		contentIdea.findSubIdeaById = function (childIdeaId) {
			var myChild = _.find(contentIdea.ideas, function (idea) {
				return idea.id == childIdeaId;
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
		if (progressCallback) {
			progressCallback();
		}
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
			if (parentIdea.id == contentAggregate.id) {
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
			var rank;
			parentIdea.ideas = parentIdea.ideas || {};
			rank = nextChildRank(parentIdea);
			parentIdea.ideas[rank] = subIdea;
			return rank;
		},
		findIdeaById = function (ideaId) {
			ideaId = parseFloat(ideaId);
			return contentAggregate.id == ideaId ? contentAggregate : contentAggregate.findSubIdeaById(ideaId);
		},
		sameSideSiblingRanks = function (parentIdea, ideaRank) {
			return _(_.map(_.keys(parentIdea.ideas), parseFloat)).reject(function (k) {return k * ideaRank < 0; });
		},
		sign = function (number) {
			/* intentionally not returning 0 case, to help with split sorting into 2 groups */
			return number < 0 ? -1 : 1;
		},
		eventStack = [],
		redoStack = [],
		isRedoInProgress = false,
		notifyChange = function (method, args, undofunc) {
			eventStack.push({eventMethod: method, eventArgs: args, undoFunction: undofunc});
			if (isRedoInProgress) {
				contentAggregate.dispatchEvent('changed', 'redo');
			} else {
				contentAggregate.dispatchEvent('changed', method, args);
				redoStack = [];
			}
		},
		reorderChild = function (parentIdea, newRank, oldRank) {
			parentIdea.ideas[newRank] = parentIdea.ideas[oldRank];
			delete parentIdea.ideas[oldRank];
		},
		cachedId;
	contentAggregate.nextId = function nextId() {
		if (!cachedId) {
			cachedId =  contentAggregate.maxId();
		}
		cachedId += 1;
		return cachedId;
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
	contentAggregate.clone = function (subIdeaId) {
		var toClone = (subIdeaId && subIdeaId != contentAggregate.id && contentAggregate.findSubIdeaById(subIdeaId)) || contentAggregate;
		return JSON.parse(JSON.stringify(toClone));
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
	contentAggregate.paste = function (parentIdeaId, jsonToPaste) {
		var pasteParent = (parentIdeaId === contentAggregate.id) ?  contentAggregate : contentAggregate.findSubIdeaById(parentIdeaId),
			removeIds = function (json) {
				var result = _.clone(json);
				delete result.id;
				if (json.ideas) {
					result.ideas = {};
					_.each(json.ideas, function (val, key) {
						result.ideas[key] = removeIds(val);
					});
				}
				return result;
			},
			newIdea = jsonToPaste && jsonToPaste.title && init(removeIds(jsonToPaste)),
			newRank;
		if (!pasteParent || !newIdea) {
			return false;
		}
		newRank = appendSubIdea(pasteParent, newIdea);
		notifyChange('paste', [parentIdeaId, jsonToPaste, newIdea.id], function () {
			delete pasteParent.ideas[newRank];
		});
		return true;
	};
	contentAggregate.flip = function (ideaId) {
		var new_rank, max_rank, current_rank = contentAggregate.findChildRankById(ideaId);
		if (!current_rank) {
			return false;
		}
		max_rank = maxKey(contentAggregate.ideas, -1 * sign(current_rank));
		new_rank = max_rank - 10 * sign(current_rank);
		reorderChild(contentAggregate, new_rank, current_rank);
		notifyChange('flip', [ideaId], function () {
			reorderChild(contentAggregate, current_rank, new_rank);
		});
		return true;
	};
	contentAggregate.updateTitle = function (ideaId, title) {
		var idea = findIdeaById(ideaId), originalTitle;
		if (!idea) {
			return false;
		}
		originalTitle = idea.title;
		if (originalTitle == title) {
			return false;
		}
		idea.title = title;
		notifyChange('updateTitle', [ideaId, title], function () {
			idea.title = originalTitle;
		});
		return true;
	};
	contentAggregate.addSubIdea = function (parentId, ideaTitle) {
		var idea, parent = findIdeaById(parentId), newRank;
		if (!parent) {
			return false;
		}
		idea = init({
			title: ideaTitle
		});
		newRank = appendSubIdea(parent, idea);
		notifyChange('addSubIdea', [parentId, ideaTitle, idea.id], function () {
			delete parent.ideas[newRank];
		});
		return true;
	};
	contentAggregate.removeSubIdea = function (subIdeaId) {
		var parent = contentAggregate.findParent(subIdeaId), oldRank, oldIdea;
		if (parent) {
			oldRank = parent.findChildRankById(subIdeaId);
			oldIdea = parent.ideas[oldRank];
			delete parent.ideas[oldRank];
			notifyChange('removeSubIdea', [subIdeaId], function () {
				parent.ideas[oldRank] = oldIdea;
			});
			return true;
		}
		return false;
	};
	contentAggregate.insertIntermediate = function (inFrontOfIdeaId, title) {
		if (contentAggregate.id == inFrontOfIdeaId) {
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
		notifyChange('insertIntermediate', [inFrontOfIdeaId, title, newIdea.id], function () {
			parentIdea.ideas[childRank] = oldIdea;
		});
		return true;
	};
	contentAggregate.changeParent = function (ideaId, newParentId) {
		var oldParent, oldRank, newRank, idea, parent = findIdeaById(newParentId);
		if (ideaId == newParentId) {
			return false;
		}
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
		oldParent = contentAggregate.findParent(ideaId);
		if (!oldParent) {
			return false;
		}
		oldRank = oldParent.findChildRankById(ideaId);
		newRank = appendSubIdea(parent, idea);
		delete oldParent.ideas[oldRank];
		notifyChange('changeParent', [ideaId, newParentId], function () {
			oldParent.ideas[oldRank] = idea;
			delete parent.ideas[newRank];
		});
		return true;
	};
	contentAggregate.updateStyle = function (ideaId, styleName, styleValue) {
		var idea = findIdeaById(ideaId), oldStyle;
		if (!idea) {
			return false;
		}
		oldStyle = _.extend({}, idea.style);
		idea.style = _.extend({}, idea.style);
		if (!styleValue || styleValue === "false") {
			if (!idea.style[styleName]) {
				return false;
			}
			delete idea.style[styleName];
		} else {
			/* leave ==, if it's a number and someone sends the equal string, it's still the same */
			if (idea.style[styleName] == styleValue) {
				return false;
			}
			idea.style[styleName] = styleValue;
		}
		if (_.size(idea.style) === 0) {
			delete idea.style;
		}
		notifyChange('updateStyle', [ideaId, styleName, styleValue], function () {
			idea.style = oldStyle;
		});
		return true;
	};
	contentAggregate.moveRelative = function (ideaId, relativeMovement) {
		var parentIdea = contentAggregate.findParent(ideaId),
			current_rank = parentIdea && parentIdea.findChildRankById(ideaId),
			sibling_ranks = current_rank && _.sortBy(sameSideSiblingRanks(parentIdea, current_rank), Math.abs),
			currentIndex = sibling_ranks && sibling_ranks.indexOf(current_rank),
			/* we call positionBefore, so movement down is actually 2 spaces, not 1 */
			newIndex = currentIndex + (relativeMovement > 0 ? relativeMovement + 1 : relativeMovement),
			beforeSibling = (newIndex >= 0) && parentIdea && sibling_ranks && parentIdea.ideas[sibling_ranks[newIndex]];
		if (newIndex < 0 || !parentIdea) {
			return false;
		}
		return contentAggregate.positionBefore(ideaId, beforeSibling && beforeSibling.id, parentIdea);
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
		if (ideaId == positionBeforeIdeaId) {
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
			before_rank = candidate_siblings.length > 0 ? _.max(candidate_siblings, Math.abs) : 0;
			if (before_rank == current_rank) {
				return false;
			}
			new_rank = before_rank + (after_rank - before_rank) / 2;
		} else {
			max_rank = maxKey(parentIdea.ideas, current_rank < 0 ? -1 : 1);
			if (max_rank == current_rank) {
				return false;
			}
			new_rank = max_rank + 10 * (current_rank < 0 ? -1 : 1);
		}
		if (new_rank == current_rank) {
			return false;
		}
		reorderChild(parentIdea, new_rank, current_rank);

		notifyChange('positionBefore', [ideaId, positionBeforeIdeaId], function () {
			reorderChild(parentIdea, current_rank, new_rank);
		});
		return true;
	};
	/* undo/redo */
	contentAggregate.undo = function () {
		var topEvent;
		topEvent = eventStack.pop();
		if (topEvent && topEvent.undoFunction) {
			topEvent.undoFunction();
			redoStack.push(topEvent);
			contentAggregate.dispatchEvent('changed', 'undo', []);
			return true;
		}
		return false;
	};
	contentAggregate.redo = function () {
		var topEvent;
		topEvent = redoStack.pop();
		if (topEvent) {
			isRedoInProgress = true;
			contentAggregate[topEvent.eventMethod].apply(contentAggregate, topEvent.eventArgs);
			isRedoInProgress = false;
			return true;
		}
		return false;
	};
	init(contentAggregate);
	return observable(contentAggregate);
};
