/*global Kinetic*/
Kinetic.Idea = function (config) {
	'use strict';
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
};
Kinetic.Idea.prototype.setIsSelected = function (isSelected) {
	this.attrs.fill = isSelected ? '#aaa' : '#ddd';
};
Kinetic.Global.extend(Kinetic.Idea, Kinetic.Text);
