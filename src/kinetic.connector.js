/*global Kinetic*/
Kinetic.Connector = function (config) {
	'use strict';
	config.stroke = 1;
	var shapeFrom = config.shapeFrom,
		shapeTo = config.shapeTo,
		self = this,
		trackShapes = function () {
			var tmp;
			if (shapeFrom.attrs.x > shapeTo.attrs.x) {
				tmp = shapeFrom;
				shapeFrom = shapeTo;
				shapeTo = tmp;
			}
			self.attrs.points = [
				{
					x: shapeFrom.attrs.x + shapeFrom.getWidth(),
					y: shapeFrom.attrs.y + 0.5 * shapeFrom.getHeight()
				}, {
					x: shapeTo.attrs.x,
					y: shapeTo.attrs.y + 0.5 * shapeTo.getHeight()
				}
			];
		};
	config.name = 'Connector';
	Kinetic.Line.apply(this, [config]);
	this.startPoint = {};
	this.endPoint = {};
	this.classType = 'Connector';
	shapeFrom.on('xChange yChange', trackShapes);
	shapeTo.on('xChange yChange', trackShapes);
	trackShapes();
};
Kinetic.Global.extend(Kinetic.Connector, Kinetic.Line);
