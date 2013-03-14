/*global _, Kinetic, MAPJS, Image, setTimeout */
Kinetic.IdeaProxy = function (idea, stage, layer) {
	'use strict';
	var cached,
		container = new Kinetic.Container({opacity: 0, draggable: true}),
		cacheImage = function () {
			console.log('cacheImage');
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
						cached.attrs.width = width;
						cached.attrs.height = height;
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

	container.cacheImage = cacheImage;
	container.getNodeAttrs = function () {
		return idea.attrs;
	};
	container.isVisible = function (offset) {
		return stage && stage.isRectVisible(new MAPJS.Rectangle(container.attrs.x, container.attrs.y, container.getWidth(), container.getHeight()), offset);
	};
	idea.isVisible = function (offset) {
		return stage && stage.isRectVisible(new MAPJS.Rectangle(container.attrs.x, container.attrs.y, container.getWidth(), container.getHeight()), offset);
	};


	idea.getLayer = function () {
		return layer;
	};
	idea.getStage = function () {
		return stage;
	};
	idea.getAbsolutePosition =  function () {
		return container.getAbsolutePosition();
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
	_.each([':textChanged', ':editing', ':nodeEditRequested'], function (fname) {
		idea.on(fname, function (event) {
			container.fire(fname, event);
		});
	});
	_.each(['setMMStyle', 'setIsSelected', 'setText', 'setIsDroppable', 'editNode'], function (fname) {
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

