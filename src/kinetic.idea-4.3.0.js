/*global console, jQuery, Kinetic*/
/*jslint nomen: true*/
(function () {
	'use strict';
	/*shamelessly copied from http://james.padolsey.com/javascript/wordwrap-for-javascript */
	var COLUMN_WORD_WRAP_LIMIT = 25;
	function wordWrap(str, width, brk, cut) {
		brk = brk || '\n';
		width = width || 75;
		cut = cut || false;
		if (!str) {
			return str;
		}
		var regex = '.{1,' + width + '}(\\s|$)' + (cut ? '|.{' + width + '}|.+$' : '|\\S+?(\\s|$)');
		return str.match(new RegExp(regex, 'g')).join(brk);
	}
	function joinLines(string) {
		return string.replace(/\s+/g, ' ');
	}
	function breakWords(string) {
		return wordWrap(joinLines(string), COLUMN_WORD_WRAP_LIMIT, '\n', false);
	}
	Kinetic.Idea = function (config) {
		var ENTER_KEY_CODE = 13,
			ESC_KEY_CODE = 27,
			self = this,
			setStageDraggable = function (isDraggable) {
				self.getStage().setDraggable(isDraggable);
			},
			text,
			border,
			border2;
		this.level = config.level;
		this.isSelected = false;
		config.draggable = config.level > 1;
		config.dragOnTop = false;// would be nice to not do this and somehow move connector too to into the drag layer
		config.name = 'Idea';
		Kinetic.Container.apply(this, [config]);
		text = new Kinetic.Text();
		this.text = text;
		this.setText = this.setStyle;
		border = new Kinetic.Rect();
		border2 = new Kinetic.Rect();/* workaround until https://github.com/ericdrowell/KineticJS/issues/232 is fixed*/
		this.border = border;
		this.border2 = border2;
		this.add(border);
		this.add(border2);
		this.add(text);
		this.setText(breakWords(config.text));
		this.classType = 'Idea';
		this.on('dblclick', self.fire.bind(self, ':nodeEditRequested'));
		this.on('mouseover touchstart', setStageDraggable.bind(null, false));
		this.on('mouseout touchend', setStageDraggable.bind(null, true));
		this.editNode = function () {
			text.setVisible(false);
			self.getLayer().draw();
			var canvasPosition = jQuery(self.getLayer().getCanvas().getElement()).offset(),
				currentText = text.getText(),
				ideaInput,
				updateText = function (newText) {
					text.setVisible(true);
					self.getStage().draw();
					self.fire(':textChanged', {
						text: breakWords(newText || currentText)
					});
					ideaInput.remove();
				},
				onCommit = function () {
					updateText(ideaInput.val());
				};
			ideaInput = jQuery('<textarea type="text" wrap="soft" class="ideaInput"></textarea>')
				.css({
					top: canvasPosition.top + self.getAbsolutePosition().y,
					left: canvasPosition.left + self.getAbsolutePosition().x,
					width: self.getWidth(),
					height: self.getHeight()
				})
				.val(joinLines(currentText))
				.appendTo('body')
				.keydown(function (e) {
					if (e.which === ENTER_KEY_CODE) {
						onCommit();
					} else if (e.which === ESC_KEY_CODE) {
						updateText(currentText);
					}
					e.stopPropagation();
				})
				.blur(onCommit)
				.focus();
		};
	};
}());
Kinetic.Idea.prototype.setStyle = function (text) {
	'use strict';
	var padding = 10,
		isDroppable = this.isDroppable,
		isSelected = this.isSelected,
		isRoot = this.level === 1;
	this.text.attrs.x = padding;
	this.text.attrs.y = padding;
	this.text.attrs.fontSize = 13;
	this.text.attrs.fontFamily = 'Helvetica';
	this.text.attrs.fontStyle = 'bold';
	this.text.attrs.align = 'center';
	this.text.attrs.lineHeight = 1.2;
	if (text) {
		this.text.setText(text);
	}
	this.border2.attrs.stroke = '#888';
	this.border2.attrs.strokeWidth = 2;
	this.border2.attrs.cornerRadius = this.border.attrs.cornerRadius = 10;
	this.border.attrs.shadowColor = 'black';
	this.border.attrs.shadowBlur = 10;
	this.border.attrs.shadowOffset = { x: 10, y: 10 };
	this.border.attrs.shadowOpacity = 0.5;
	if (isDroppable) {
		this.border2.attrs.stroke = '#9F4F4F';
		this.border.attrs.fillLinearGradientStartPoint = { x: 0, y: 0 };
		this.border.attrs.fillLinearGradientEndPoint = { x: 50, y: 100 };
		this.border.attrs.fillLinearGradientColorStops = [0, '#EF6F6F', 1, '#CF4F4F'];
		this.text.attrs.fill = '#FFFFFF';
	} else if (isSelected) {
		this.border.attrs.fillLinearGradientStartPoint = { x: 0, y: 0 };
		this.border.attrs.fillLinearGradientEndPoint = { x: 50, y: 100 };
		this.border.attrs.fillLinearGradientColorStops = [0, '#6FCF6F', 1, '#5FBF5F'];
		this.text.attrs.fill = '#FFFFFF';
	} else {
		this.border2.attrs.stroke = isRoot ? '#88F' : '#888';
		this.border.attrs.fillLinearGradientStartPoint = { x: 0, y: 0 };
		this.border.attrs.fillLinearGradientEndPoint = { x: 50, y: 100 };
		this.border.attrs.fillLinearGradientColorStops = isRoot ? [0, '#4FCFEF', 1, '#30B0EF'] : [0, '#FFFFFF', 1, '#E0E0E0'];
		this.text.attrs.fill = isRoot ? '#FFFFFF' : '#5F5F5F';
	}
	this.setWidth(this.border2.attrs.width = this.border.attrs.width = this.text.getWidth() + 2 * padding);
	this.setHeight(this.border2.attrs.height = this.border.attrs.height = this.text.getHeight() + 2 * padding);
};
Kinetic.Idea.prototype.setIsSelected = function (isSelected) {
	'use strict';
	this.isSelected = isSelected;
	this.setStyle();
	this.getLayer().draw();
};
Kinetic.Idea.prototype.setIsDroppable = function (isDroppable) {
	'use strict';
	this.isDroppable = isDroppable;
	this.setStyle();
	this.getLayer().draw();
};
Kinetic.Idea.prototype.transitionToAndDontStopCurrentTransitions = function (config) {
	'use strict';
	//this is here for 'backward' compatibility, so I don't have to change mediator that works correctly with kinetic.idea 4.2.0
	this.transitionTo(config);
};
Kinetic.Global.extend(Kinetic.Idea, Kinetic.Container);
