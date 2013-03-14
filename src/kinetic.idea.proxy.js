/*global _, Kinetic, MAPJS, Image, setTimeout */
Kinetic.IdeaProxy = function (idea, container, stage, layer) {
	'use strict';
	var cached,
		cacheImage = function () {
			var x = -1, y = -1,
				width = idea.getWidth() + 20,
				height = idea.getHeight() + 20;
			idea.toImage({
				x: x,
				y: y,
				width: width,
				height: height,
				callback: function (img) {
					if (cached) {
						cached.setImage(img);
					} else {
						var image = new Kinetic.Image({
							x: x,
							y: y,
							width: width,
							height: height,
							image: img
						});
						container.add(image);
						cached = image;
						container.getLayer().draw();
					}
				}
			});
		};

	container.attrs.x = idea.attrs.x;
	container.attrs.y = idea.attrs.y;
	idea.attrs.x = 0;
	idea.attrs.y = 0;
	//container.add(idea);

	container.cacheImage = cacheImage;

	container.isVisible = function (offset) {
		return stage && stage.isRectVisible(new MAPJS.Rectangle(container.attrs.x, container.attrs.y, container.getWidth(), container.getHeight()), offset);
	};
	idea.isVisible = function (offset) {
		return stage && stage.isRectVisible(new MAPJS.Rectangle(container.attrs.x, container.attrs.y, container.getWidth(), container.getHeight()), offset);
	};
	idea.getLayer = function () {
		return layer;
	};
	container.transitionToAndDontStopCurrentTransitions = function (config) {
		var transition = new Kinetic.Transition(container, config),
			animation = new Kinetic.Animation();
		animation.func = transition._onEnterFrame.bind(transition);
		animation.node = container.getLayer();
		transition.onFinished = animation.stop.bind(animation);
		transition.start();
		animation.start();
	};
	_.each(['getHeight', 'getWidth'], function (fname) {
		container[fname] = function () {
			return idea && idea[fname] && idea[fname].apply(idea, arguments);
		};
	});
	_.each(['setMMStyle', 'setIsSelected', 'setText', 'setIsDroppable'], function (fname) {
		container[fname] = function () {
			var result = idea && idea[fname] && idea[fname].apply(idea, arguments);
			cacheImage();
			return result;
		};
	});

	layer.add(container);
	container.transitionToAndDontStopCurrentTransitions({
		opacity: 1,
		duration: 0.4
	});
	container.cacheImage();
	return container;
};

