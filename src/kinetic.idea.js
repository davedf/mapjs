/*global console, Kinetic*/
Kinetic.Idea = function (config) {
	'use strict';
	var self = this;
	config.stroke = '#888';
	config.strokeWidth = 3;
	config.fill = '#ddd';
	config.fontSize = 11;
	config.fontFamily = 'Calibri';
	config.textFill = '#555';
	config.padding = 12;
	config.align = 'center';
	config.fontStyle = 'italic';
	config.shadow = {
		color: 'black',
		blur: 10,
		offset: [4, 4],
		opacity: 0.4
	};
	config.cornerRadius = 10;
	config.draggable = true;
	config.name = "Idea";
	Kinetic.Text.apply(this, [config]);
	this.classType = "Idea";
	this.on('dblclick', function () {
		self.attrs.textFill = '#aaa';
		var canvasPosition = $('canvas').offset(),
			currentText = self.getText(),
			ideaInput,
			onCommit = function () {
				self.attrs.textFill = '#555';
				self.getStage().draw();
				self.fire(':textChanged', ideaInput.val());
				ideaInput.remove();
			};
		ideaInput = $('<input type="text" class="ideaInput" />')
			.css({
				position: 'absolute',
				display: 'block',
				top: canvasPosition.top + self.attrs.y,
				left: canvasPosition.left + self.attrs.x,
				width: self.getWidth(),
				height: self.getHeight()
			})
			.val(currentText)
			.appendTo('body')
			.keydown(function (e) {
				if (e.which === 13) {
					onCommit();
					e.stopPropagation();
				}
			})
			.blur(onCommit)
			.focus();
	});
};
Kinetic.Idea.prototype.setIsSelected = function (isSelected) {
	'use strict';
	this.attrs.fill = isSelected ? '#aaa' : '#ddd';
};
Kinetic.Global.extend(Kinetic.Idea, Kinetic.Text);
