/*global Kinetic*/
Kinetic.Connector = function (config) {
	'use strict';
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
			self.startPoint.x = shapeFrom.attrs.x + shapeFrom.getWidth();
			self.startPoint.y = shapeFrom.attrs.y + 0.5 * shapeFrom.getHeight();
			self.endPoint.x = shapeTo.attrs.x;
			self.endPoint.y = shapeTo.attrs.y + 0.5 * shapeTo.getHeight();
			self.controlPoint1.x = 0.5 * (self.startPoint.x + self.endPoint.x);
			self.controlPoint1.y = self.startPoint.y;
			self.controlPoint2.x = self.controlPoint1.x;
			self.controlPoint2.y = self.endPoint.y;
		};
	config.name = 'Connector';
	Kinetic.Bezier.apply(this, [config]);
	this.startPoint = {};
	this.controlPoint1 = {};
	this.controlPoint2 = {};
	this.endPoint = {};
	this.classType = 'Connector';
	shapeFrom.on('xChange yChange', trackShapes);
	shapeTo.on('xChange yChange', trackShapes);
	trackShapes();
};
Kinetic.Global.extend(Kinetic.Connector, Kinetic.Bezier);
