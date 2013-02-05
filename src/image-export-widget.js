/*global _, jQuery, MAPJS, Kinetic */
jQuery.fn.imageExportWidget = function (idea, imageCallBack) {
	'use strict';
	this.click(
		function () {
			var layout = MAPJS.calculateLayout(idea, MAPJS.KineticMediator.dimensionProvider),
				frame = MAPJS.calculateFrame(layout.nodes, 10),
				hiddencontainer = jQuery('<div></div>').css('visibility', 'hidden')
					.appendTo('body').width(frame.width).height(frame.height).attr('id', 'hiddencontainer'),
				hiddenstage = new Kinetic.Stage({ container: 'hiddencontainer' }),
				layer = new Kinetic.Layer(),
				backgroundLayer = new Kinetic.Layer(),
				nodeByIdeaId = {},
				bg = new Kinetic.Rect({
					fill: '#ffffff',
					x: frame.left,
					y: frame.top,
					width: frame.width,
					height: frame.height
				});
			hiddenstage.add(backgroundLayer);
			backgroundLayer.add(bg);
			hiddenstage.add(layer);
			hiddenstage.setWidth(frame.width);
			hiddenstage.setHeight(frame.height);
			hiddenstage.attrs.x = -1 * frame.left;
			hiddenstage.attrs.y = -1 * frame.top;
			_.each(layout.nodes, function (n) {
				var node = new Kinetic.Idea({
					level: n.level,
					x: n.x,
					y: n.y,
					text: n.title
				});
				nodeByIdeaId[n.id] = node;
				layer.add(node);
			});
			_.each(layout.connectors, function (n) {
				var connector = new Kinetic.Connector({
					shapeFrom: nodeByIdeaId[n.from],
					shapeTo: nodeByIdeaId[n.to],
					stroke: '#888',
					strokeWidth: 1,
				});
				layer.add(connector);
				connector.moveToBottom();
			});
			hiddenstage.draw();
			hiddenstage.toDataURL({
				callback: function (url) {
					imageCallBack(url);
					hiddencontainer.remove();
				}
			});
		}
	);
	return this;
};
