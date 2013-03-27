/*global _, Kinetic, MAPJS, Image, setTimeout, jQuery */
Kinetic.IdeaProxy = function (idea, stage, layer) {
	'use strict';
	var nodeimage,
		emptyImage,
		imageRendered,
		container = new Kinetic.Group({opacity: 0, draggable: true}),
		removeImage = function () {
			nodeimage.setImage(emptyImage);
			imageRendered = false;
		},
		cacheImage = function () {
			if (!idea.isVisible()) {
				removeImage();
				return;
			}
			if (imageRendered) {
				return;
			}
			imageRendered = true;
			var scale = stage.getScale().x, x = -scale, y = -scale,
				unscaledWidth = idea.getWidth() + 20,
				unscaledHeight = idea.getHeight() + 20,
				width = (unscaledWidth * scale),
				height = (unscaledHeight * scale);
			idea.setScale({x: scale, y: scale});
			idea.toImage({
				x: x,
				y: y,
				width: width,
				height: height,
				callback: function (img) {
					nodeimage.setImage(img);
					nodeimage.attrs.width = unscaledWidth;
					nodeimage.attrs.height = unscaledHeight;
					layer.draw();
				}
			});
		},
		reRender = function () {
			imageRendered = false;
			cacheImage();
		},
		nodeImageDrawFunc;
	container.attrs.x = idea.attrs.x;
	container.attrs.y = idea.attrs.y;
	idea.attrs.x = 0;
	idea.attrs.y = 0;
	nodeimage = new Kinetic.Image({
		x: -1,
		y: -1,
		width: idea.getWidth() + 20,
		height: idea.getHeight() + 20
	});
	nodeImageDrawFunc = nodeimage.getDrawFunc().bind(nodeimage);
	nodeimage.setDrawFunc(function (canvas) {
		cacheImage();
		nodeImageDrawFunc(canvas);
	});

	container.add(nodeimage);


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
	_.each(['getHeight', 'getWidth', 'getIsSelected'], function (fname) {
		container[fname] = function () {
			return idea && idea[fname] && idea[fname].apply(idea, arguments);
		};
	});
	_.each([':textChanged', ':editing'], function (fname) {
		idea.on(fname, function (event) {
			container.fire(fname, event);
			reRender();
		});
	});
	_.each(['setMMStyle', 'setIsSelected', 'setText', 'setIsDroppable', 'editNode', 'setupShadows'], function (fname) {
		container[fname] = function () {
			var result = idea && idea[fname] && idea[fname].apply(idea, arguments);
			reRender();
			return result;
		};
	});
	return container;
};

