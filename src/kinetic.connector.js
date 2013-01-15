/*global Kinetic*/
(function() {
   'use strict';
   Kinetic.Connector = function(config) {
      this.shapeFrom = config.shapeFrom;
      this.shapeTo = config.shapeTo;
      this.shapeType = 'Connector';
      Kinetic.Shape.call(this, config);
      this._setDrawFuncs();
   };
   var horisontalConnector = function(parent, child) {
         var childHorizontalOffset = parent.attrs.x < child.attrs.x ? 0.1 : 0.9;
         var parentHorizontalOffset = 1- childHorizontalOffset;
         return {
            from: {
               x: parent.attrs.x + parentHorizontalOffset * parent.getWidth(),
               y: parent.attrs.y + 0.5 * parent.getHeight()
            },
            to: {
               x: child.attrs.x + childHorizontalOffset * child.getWidth(),
               y: child.attrs.y + 0.5 * child.getHeight()
            },
            controlPointOffset: 0,
         }
       }
       
   var calculateConnector = function(parent, child, ctrl) {
		   var tolerance = 10;
         var childMid = child.attrs.y + child.getHeight() * 0.5;
         var parentMid = parent.attrs.y + parent.getHeight() * 0.5;
         if (Math.abs(parentMid-childMid)<Math.min(child.getHeight(),parent.getHeight())*0.75) {
            return horisontalConnector(parent, child);
         }
         var childHorizontalOffset = parent.attrs.x < child.attrs.x ? 0 : 1;
         return {
            from: {
               x: parent.attrs.x + 0.5 * parent.getWidth() ,
               y: parent.attrs.y + 0.5 * parent.getHeight()
            },
            to: {
               x: child.attrs.x + childHorizontalOffset * child.getWidth(),
               y: child.attrs.y + 0.5 * child.getHeight()
            },
            controlPointOffset: 0.75
         }

       }
       
   Kinetic.Connector.prototype = {
      drawFunc: function(canvas) {
         var context = this.getContext(),
             tmp, shapeFrom = this.shapeFrom,
             shapeTo = this.shapeTo,
             ctrl = 0.2;


         var conn = calculateConnector(shapeFrom, shapeTo, ctrl);
         if (!conn) return;
         context.beginPath();
         context.moveTo(conn.from.x, conn.from.y);
         var offset = conn.controlPointOffset * (conn.from.y - conn.to.y);
         var maxOffset = Math.min(shapeTo.getHeight(), shapeFrom.getHeight()) * 1.5;
         offset = Math.max(-1 * maxOffset,Math.min(maxOffset,offset));
         context.quadraticCurveTo(conn.from.x, conn.to.y - offset, conn.to.x, conn.to.y);
         canvas.stroke(this);
      }
   };
   Kinetic.Global.extend(Kinetic.Connector, Kinetic.Shape);
}());
