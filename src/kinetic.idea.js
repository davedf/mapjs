/*global MAPJS, Color, _, jQuery, Kinetic*/
/*jslint nomen: true, newcap: true*/
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
			unformattedText = joinLines(config.text),
			oldSetText,
			oldTransitionTo;
		config.text = breakWords(config.text);
		this.level = config.level;
		this.mmStyle = config.mmStyle;
		this.isSelected = false;
		config.draggable = true;
		config.name = 'Idea';
		Kinetic.Group.call(this, config);
		this.rect = new Kinetic.Rect({
			strokeWidth: 1,
			cornerRadius: 10
		});
		this.text = new Kinetic.Text({
			text: config.text,
			fontSize: 10,
			fontFamily: 'Helvetica',
			lineHeight: 1.5,
			fontStyle: 'bold',
			align: 'center'
		});
		this.add(this.rect);
		this.add(this.text);
		this.setText = function (text) {
			unformattedText = text;
			self.text.setText(breakWords(text));
			self.setStyle();
		};
		this.setStyle();
		this.classType = 'Idea';
		/*
		this.oldDrawFunc = this.getDrawFunc();
		this.setDrawFunc(function (canvas) {
			if (self.isVisible()) {
				if (this.mmStyle && this.mmStyle.collapsed) {
					var context = canvas.getContext(), width = this.getWidth(), height = this.getHeight();
					this.drawCollapsedBG(canvas, {x: 8, y: 8});
					this.drawCollapsedBG(canvas, {x: 4, y: 4});
				}
				this.oldDrawFunc(canvas);
			}
		});
		oldTransitionTo = this.transitionTo.bind(this);
		this.transitionTo = function (transition) {
			if (!self.isVisible()) {
				transition.duration = 0.01;
			}
			oldTransitionTo(transition);
		};
		*/
		this.getNodeAttrs = function () {
			return self.attrs;
		};
		this.drawCollapsedBG = function (canvas, offset) {
			var context = canvas.getContext(),
				cornerRadius = this.getCornerRadius(),
				width = this.getWidth(),
				height = this.getHeight();
			context.beginPath();
			if (cornerRadius === 0) {
				context.rect(offset.x, offset.y, width, height);
			} else {
				context.moveTo(offset.x + cornerRadius, offset.y);
				context.lineTo(offset.x + width - cornerRadius, offset.y);
				context.arc(offset.x + width - cornerRadius, offset.y + cornerRadius, cornerRadius, Math.PI * 3 / 2, 0, false);
				context.lineTo(offset.x + width, offset.y + height - cornerRadius);
				context.arc(offset.x + width - cornerRadius, offset.y + height - cornerRadius, cornerRadius, 0, Math.PI / 2, false);
				context.lineTo(offset.x + cornerRadius, offset.y + height);
				context.arc(offset.x + cornerRadius, offset.y + height - cornerRadius, cornerRadius, Math.PI / 2, Math.PI, false);
				context.lineTo(offset.x, offset.y + cornerRadius);
				context.arc(offset.x + cornerRadius, offset.y + cornerRadius, cornerRadius, Math.PI, Math.PI * 3 / 2, false);
			}
			context.closePath();
			canvas.fillStroke(this);
		};
		this.isVisible = function (offset) {
			var stage = self.getStage();
			return stage && stage.isRectVisible(new MAPJS.Rectangle(self.attrs.x, self.attrs.y, self.getWidth(), self.getHeight()), offset);
		};
		this.getAbsolutePosition = function () {
			return { x: self.getStage().getPosition().x + self.getPosition().x * self.getStage().getScale().x,
					y:  self.getStage().getPosition().y + self.getPosition().y * self.getStage().getScale().y};
		};
		this.editNode = function (shouldSelectAll) {
			self.fire(':editing');
			self.getLayer().draw();
			var canvasPosition = jQuery(self.getLayer().getCanvas().getElement()).offset(),
				ideaInput,
				onStageMoved = _.throttle(function () {
					ideaInput.css({
						top: canvasPosition.top + self.rect.getAbsolutePosition().y,
						left: canvasPosition.left + self.rect.getAbsolutePosition().x
					});
				}, 10),
				updateText = function (newText) {
					self.setStyle();
					self.getStage().draw();
					self.fire(':textChanged', {
						text: newText || unformattedText
					});
					ideaInput.remove();
					self.stopEditing = undefined;
					self.getStage().off('xChange yChange', onStageMoved);
				},
				onCommit = function () {
					updateText(ideaInput.val());
				},
				onCancelEdit = function () {
					updateText(unformattedText);
				},
				scale = self.getStage().getScale().x || 1;
			ideaInput = jQuery('<textarea type="text" wrap="soft" class="ideaInput"></textarea>')
				.css({
					top: canvasPosition.top + self.getAbsolutePosition().y,
					left: canvasPosition.left + self.getAbsolutePosition().x,
					width: (6 + self.getWidth()) * scale,
					height: (6 + self.getHeight()) * scale,
					'padding': 3 * scale + 'px',
					'font-size': self.text.attrs.fontSize * scale + 'pt',
					'line-height': 1.2,
					'background-color': self.getBackground(),
					'margin': -3 * scale,
					'border-radius': self.rect.attrs.cornerRadius * scale + 'px',
					'border': self.rect.attrs.strokeWidth * (2 * scale) + 'px dashed ' + self.rect.attrs.stroke,
					'color': self.text.attrs.fill
				})
				.val(unformattedText)
				.appendTo('body')
				.keydown(function (e) {
					if (e.which === ENTER_KEY_CODE) {
						onCommit();
					} else if (e.which === ESC_KEY_CODE) {
						onCancelEdit();
					} else if (e.which === 9) {
						e.preventDefault();
					} else if (e.which === 83 && (e.metaKey || e.ctrlKey)) {
						e.preventDefault();
						onCommit();
						return; /* propagate to let the environment handle ctrl+s */
					} else if (!e.shiftKey && e.which === 90 && (e.metaKey || e.ctrlKey)) {
						if (ideaInput.val() === unformattedText) {
							onCancelEdit();
						}
					}
					e.stopPropagation();
				})
				.blur(onCommit)
				.focus(function () {
					if (shouldSelectAll) {
						if (ideaInput[0].setSelectionRange) {
							ideaInput[0].setSelectionRange(0, unformattedText.length);
						} else {
							ideaInput.select();
						}
					} else if (ideaInput[0].setSelectionRange) {
						ideaInput[0].setSelectionRange(unformattedText.length, unformattedText.length);
					}
				})
				.on('input', function () {
					var text = new Kinetic.Idea({
						text: ideaInput.val()
					});
					ideaInput.width(Math.max(ideaInput.width(), text.getWidth() * scale));
					ideaInput.height(Math.max(ideaInput.height(), text.getHeight() * scale));
				});

			self.stopEditing = onCancelEdit;
			ideaInput.focus();

			self.getStage().on('xChange yChange', onStageMoved);
		};
	};
}());
Kinetic.Idea.prototype.getScale = function () {
	'use strict';
	var stage = this.getStage();
	return (stage && stage.attrs && stage.attrs.scale && stage.attrs.scale.x) || (this.attrs && this.attrs.scale && this.attrs.scale.x) || 1;
};


Kinetic.Idea.prototype.setupShadows = function () {
	'use strict';
	var scale = this.getScale(),
		isSelected = this.isSelected,
		offset =  (this.mmStyle && this.mmStyle.collapsed) ? 3 * scale : 4 * scale,
		normalShadow = {
			color: 'black',
			blur: 10 * scale,
			offset: [offset, offset],
			opacity: 0.4 * scale
		},
		selectedShadow = {
			color: 'black',
			blur: 0,
			offset: [offset, offset],
			opacity: 1
		},
		shadow = isSelected ? selectedShadow : normalShadow;
	this.rect.setShadowColor(shadow.color);
	this.rect.setShadowBlur(shadow.blur);
	this.rect.setShadowOpacity(shadow.opacity);
	this.rect.setShadowOffset(shadow.offset);
	//if (this.rect.attrs && this.rect.attrs.shadow) {
	//this.rect.setShadow(isSelected ? selectedShadow : normalShadow);
	//}
};
Kinetic.Idea.prototype.getBackground = function () {
	'use strict';
	/*jslint newcap: true*/
	var isRoot = this.level === 1,
		defaultBg = MAPJS.defaultStyles[isRoot ? 'root' : 'nonRoot'].background,
		validColor = function (color, defaultColor) {
			if (!color) {
				return defaultColor;
			}
			var parsed = Color(color).hexString();
			return color.toUpperCase() === parsed.toUpperCase() ? color : defaultColor;
		};
	return validColor(this.mmStyle && this.mmStyle.background, defaultBg);
};
Kinetic.Idea.prototype.setStyle = function () {
	'use strict';
	/*jslint newcap: true*/
	var isDroppable = this.isDroppable,
		isRoot = this.level === 1,
		isSelected = this.isSelected,
		background = this.getBackground(),
		tintedBackground = Color(background).mix(Color('#EEEEEE')).hexString(),
		padding = 8;
	this.rect.attrs.width = this.text.getWidth() + 2 * padding;
	this.rect.attrs.height = this.text.getHeight() + 2 * padding;
	this.attrs.width = this.text.getWidth() + 2 * padding;
	this.attrs.height = this.text.getHeight() + 2 * padding;
	this.text.attrs.x = this.attrs.x + padding;
	this.text.attrs.y = this.attrs.y + padding;
	this.rect.attrs.x = this.attrs.x;
	this.rect.attrs.y = this.attrs.y;

	if (isDroppable) {
		this.rect.attrs.stroke = '#9F4F4F';
		this.rect.attrs.fillLinearGradientStartPoint = {x: 0, y: 0};
		this.rect.attrs.fillLinearGradientEndPoint = {x: 100, y: 100};
		this.rect.attrs.fillLinearGradientColorStops = [0, '#EF6F6F', 1, '#CF4F4F'];
		background = '#EF6F6F';
	} else if (isSelected) {
		this.rect.attrs.fill = background;
	} else {
		this.rect.attrs.stroke = '#888';
		this.rect.attrs.fillLinearGradientStartPoint = {x: 0, y: 0};
		this.rect.attrs.fillLinearGradientEndPoint = {x: 100, y: 100};
		this.rect.attrs.fillLinearGradientColorStops = [0, tintedBackground, 1, background];
	}
	this.setupShadows();
	this.text.attrs.fill = MAPJS.contrastForeground(tintedBackground);
};
Kinetic.Idea.prototype.setMMStyle = function (newMMStyle) {
	'use strict';
	this.mmStyle = newMMStyle;
	this.setStyle();
	this.getLayer().draw();
};
Kinetic.Idea.prototype.getIsSelected = function () {
	'use strict';
	return this.isSelected;
};

Kinetic.Idea.prototype.setIsSelected = function (isSelected) {
	'use strict';
	this.isSelected = isSelected;
	this.setStyle();
	this.getLayer().draw();
	if (!isSelected && this.stopEditing) {
		this.stopEditing();
	}
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
	this.transAnim = animation;
	animation.func = transition._onEnterFrame.bind(transition);
	animation.node = this.getLayer();
	transition.onFinished = animation.stop.bind(animation);
	transition.start();
	animation.start();
};
Kinetic.Global.extend(Kinetic.Idea, Kinetic.Group);
