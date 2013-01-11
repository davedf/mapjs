/*global Kinetic*/
(function () {
	'use strict';
	var mindPoint = function (shape) {
		return {
			x: shape.attrs.x + 0.5 * shape.getWidth(),
			y: shape.attrs.y + 0.5 * shape.getHeight()
		};
	};
	Kinetic.Connector = function (config) {
		this.shapeFrom = config.shapeFrom;
		this.shapeTo = config.shapeTo;
		this.shapeType = 'Connector';
		Kinetic.Shape.call(this, config);
		this._setDrawFuncs();
	};
	Kinetic.Connector.prototype = {
		drawFunc: function (canvas) {
			var context = this.getContext(), from = mindPoint(this.shapeFrom), to = mindPoint(this.shapeTo);
			context.beginPath();
			context.moveTo(from.x, from.y);
			context.bezierCurveTo(to.x, from.y, from.x, to.y, to.x, to.y);
			canvas.stroke(this);
		}
	};
	Kinetic.Global.extend(Kinetic.Connector, Kinetic.Shape);
}());
