/*global console, jQuery, Kinetic*/
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
		return string.replace(/\n/g, ' ');
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
			};
		config.text = breakWords(config.text);
		this.level = config.level;
		this.isSelected = false;
		this.setStyle(config);
		config.align = 'center';
		config.shadow = {
			color: 'black',
			blur: 10,
			offset: [4, 4],
			opacity: 0.4
		};
		config.cornerRadius = 10;
		config.draggable = true;
		config.name = 'Idea';
		Kinetic.Text.apply(this, [config]);
		this.classType = 'Idea';
		this.on('dblclick', self.fire.bind(self, ':nodeEditRequested'));
		this.on('mouseover touchstart', setStageDraggable.bind(null, false));
		this.on('mouseout touchend', setStageDraggable.bind(null, true));
		this.editNode = function () {
			//this only works for solid color nodes
			self.attrs.textFill = self.attrs.fill;
			self.getLayer().draw();
			var canvasPosition = jQuery(self.getLayer().getCanvas().getElement()).offset(),
				currentText = self.getText(),
				ideaInput,
				updateText = function (newText) {
					self.setStyle(self.attrs);
					self.getStage().draw();
					self.fire(':textChanged', {
						text: breakWords(newText || currentText)
					});
					ideaInput.remove();
				},
				onCommit = function () {
					updateText(ideaInput.val());
				};
			ideaInput = jQuery('<textarea type="text" class="ideaInput"></textarea>')
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
Kinetic.Idea.prototype.setStyle = function (config) {
	'use strict';
	var isDroppable = this.isDroppable,
		isSelected = this.isSelected,
		isRoot = this.level === 1;
	config.strokeWidth = 1;
	config.padding = 8;
	config.fontSize = 10;
	config.fontFamily = 'Helvetica';
	config.lineHeight = 1.5;
	config.fontStyle = 'bold';
	if (isDroppable) {
		config.stroke = '#9F4F4F';
		config.fill = {
			start: { x: 0, y: 0 },
			end: {x: 0, y: 20 },
			colorStops: [0, '#EF6F6F', 1, '#CF4F4F']
		};
		config.textFill = '#FFFFFF';
	} else if (isSelected) {
		config.fill = '#5FBF5F';
		config.textFill = '#FFFFFF';
	} else {
		config.stroke = isRoot ? '#88F' : '#888';
		config.fill = {
			start: { x: 0, y: 0 },
			end: {x: 50, y: 100 },
			colorStops: isRoot ? [0, '#4FDFFF', 1, '#30C0FF'] : [0, '#FFFFFF', 1, '#E0E0E0']
		};
		config.textFill = isRoot ? '#FFFFFF' : '#5F5F5F';
	}
};
Kinetic.Idea.prototype.setIsSelected = function (isSelected) {
	'use strict';
	this.isSelected = isSelected;
	this.setStyle(this.attrs);
	this.getLayer().draw();
};
Kinetic.Idea.prototype.setIsDroppable = function (isDroppable) {
	'use strict';
	this.isDroppable = isDroppable;
	this.setStyle(this.attrs);
};
Kinetic.Idea.prototype.transitionToAndDontStopCurrentTransitions = function (config) {
	'use strict';
	var transition = new Kinetic.Transition(this, config),
		animation = new Kinetic.Animation();
	animation.func = transition._onEnterFrame.bind(transition);
	animation.node = this.getLayer();
	transition.onFinished = animation.stop.bind(animation);
	transition.start();
	animation.start();
};
Kinetic.Global.extend(Kinetic.Idea, Kinetic.Text);