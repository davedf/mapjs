/*global Kinetic*/
(function () {
	'use strict';
	Kinetic.Connector = function (config) {
		this.shapeFrom = config.shapeFrom;
		this.shapeTo = config.shapeTo;
		this.shapeType = 'Connector';
		Kinetic.Shape.call(this, config);
		this._setDrawFuncs();
	};
	Kinetic.Connector.prototype = {
		drawFunc: function (canvas) {
			var context = this.getContext(),
				tmp,
				shapeFrom = this.shapeFrom,
				shapeTo = this.shapeTo,
				ctrl = 0.4;
			if (shapeFrom.attrs.x > shapeTo.attrs.x) {
				tmp = shapeFrom;
				shapeFrom = shapeTo;
				shapeTo = tmp;
			}
			context.beginPath();
			context.moveTo(
				shapeFrom.attrs.x + shapeFrom.getWidth(),
				shapeFrom.attrs.y + 0.5 * shapeFrom.getHeight()
			);
			context.bezierCurveTo(
				ctrl * (shapeFrom.attrs.x + shapeFrom.getWidth()) + (1 - ctrl) * shapeTo.attrs.x,
				shapeFrom.attrs.y + 0.5 * shapeFrom.getHeight(),
				(1 - ctrl) * (shapeFrom.attrs.x + shapeFrom.getWidth()) + ctrl * shapeTo.attrs.x,
				shapeTo.attrs.y + 0.5 * shapeTo.getHeight(),
				shapeTo.attrs.x,
				shapeTo.attrs.y + 0.5 * shapeTo.getHeight()
			);
			canvas.stroke(this);
		}
	};
	Kinetic.Global.extend(Kinetic.Connector, Kinetic.Shape);
}());
