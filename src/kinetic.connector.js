/*global Kinetic*/
/*jslint nomen: true*/
(function () {
	'use strict';
	var horizontalConnector, calculateConnector;
	Kinetic.Connector = function (config) {
		var oldTransitionTo;
		this.shapeFrom = config.shapeFrom;
		this.shapeTo = config.shapeTo;
		this.shapeType = 'Connector';
		Kinetic.Shape.call(this, config);
		oldTransitionTo = this.transitionTo.bind(this);
		this.transitionTo = function (transition) {
			if (!(this.shapeFrom.isVisible || this.shapeTo.isVisible())) {
				transition.duration = 0.01;
			}
			oldTransitionTo(transition);
		};
		this._setDrawFuncs();
	};
	horizontalConnector = function (parent, child) {
		var childHorizontalOffset = parent.attrs.x < child.attrs.x ? 0.1 : 0.9,
			parentHorizontalOffset = 1 - childHorizontalOffset;
		return {
			from: {
				x: parent.attrs.x + parentHorizontalOffset * parent.getWidth(),
				y: parent.attrs.y + 0.5 * parent.getHeight()
			},
			to: {
				x: child.attrs.x + childHorizontalOffset * child.getWidth(),
				y: child.attrs.y + 0.5 * child.getHeight()
			},
			controlPointOffset: 0
		};
	};
	calculateConnector = function (parent, child) {
		var tolerance = 10,
			childMid = child.attrs.y + child.getHeight() * 0.5,
			parentMid = parent.attrs.y + parent.getHeight() * 0.5,
			childHorizontalOffset;
		if (Math.abs(parentMid - childMid) + tolerance < Math.max(child.getHeight(), parent.getHeight()) * 0.75) {
			return horizontalConnector(parent, child);
		}
		childHorizontalOffset = parent.attrs.x < child.attrs.x ? 0 : 1;
		return {
			from: {
				x: parent.attrs.x + 0.5 * parent.getWidth(),
				y: parent.attrs.y + 0.5 * parent.getHeight()
			},
			to: {
				x: child.attrs.x + childHorizontalOffset * child.getWidth(),
				y: child.attrs.y + 0.5 * child.getHeight()
			},
			controlPointOffset: 0.75
		};
	};
	Kinetic.Connector.prototype = {
		drawFunc: function (canvas) {
			var context = canvas.getContext(),
				shapeFrom = this.shapeFrom,
				shapeTo = this.shapeTo,
				conn,
				offset,
				maxOffset;
			if (!(shapeFrom.isVisible() || shapeTo.isVisible())) {
				return;
			}
			conn = calculateConnector(shapeFrom, shapeTo);
			if (!conn) {
				return;
			}
			context.beginPath();
			context.moveTo(conn.from.x, conn.from.y);
			offset = conn.controlPointOffset * (conn.from.y - conn.to.y);
			maxOffset = Math.min(shapeTo.getHeight(), shapeFrom.getHeight()) * 1.5;
			offset = Math.max(-maxOffset, Math.min(maxOffset, offset));
			context.quadraticCurveTo(conn.from.x, conn.to.y - offset, conn.to.x, conn.to.y);
			canvas.stroke(this);
		}
	};
	Kinetic.Global.extend(Kinetic.Connector, Kinetic.Shape);
}());
