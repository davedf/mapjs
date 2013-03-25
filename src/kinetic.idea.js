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
		this.setStyle(config);
		config.draggable = true;
		config.name = 'Idea';
		Kinetic.Text.apply(this, [config]);
		oldSetText = this.setText.bind(this);
		this.setText = function (text) {
			unformattedText = text;
			oldSetText(breakWords(text));
		};
		this.classType = 'Idea';
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
		this.editNode = function (shouldSelectAll) {
			self.fire(':editing');
			self.getLayer().draw();
			var canvasPosition = jQuery(self.getLayer().getCanvas().getElement()).offset(),
				ideaInput,
				onStageMoved = _.throttle(function () {
					ideaInput.css({
						top: canvasPosition.top + self.getAbsolutePosition().y,
						left: canvasPosition.left + self.getAbsolutePosition().x
					});
				}, 10),
				updateText = function (newText) {
					self.setStyle(self.attrs);
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
					'font-size': self.attrs.fontSize * scale + 'pt',
					'line-height': 1.2,
					'background-color': self.getBackground(),
					'margin': -3 * scale,
					'border-radius': self.attrs.cornerRadius * scale + 'px',
					'border': self.attrs.strokeWidth * (2 * scale) + 'px dashed ' + self.attrs.stroke,
					'color': self.attrs.textFill
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
				.focus()
				.on('input', function () {
					var text = new Kinetic.Idea({
						text: ideaInput.val()
					});
					ideaInput.width(Math.max(ideaInput.width(), text.getWidth() * scale));
					ideaInput.height(Math.max(ideaInput.height(), text.getHeight() * scale));
				});
			self.stopEditing = onCancelEdit;
			if (shouldSelectAll) {
				ideaInput.select();
			} else if (ideaInput[0].setSelectionRange) {
				ideaInput[0].setSelectionRange(unformattedText.length, unformattedText.length);
			}

			self.getStage().on('xChange yChange', onStageMoved);
		};
	};
}());
Kinetic.Idea.prototype.getScale = function () {
	'use strict';
	var stage = this.getStage();
	return (stage && stage.attrs && stage.attrs.scale && stage.attrs.scale.x) || (this.attrs && this.attrs.scale && this.attrs.scale.x) || 1;
};


Kinetic.Idea.prototype.setupShadows = function (config) {
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
		};
	if (this.attrs && this.attrs.shadow) {
		this.setShadow(isSelected ? selectedShadow : normalShadow);
	} else if (config) {
		config.shadow = isSelected ? selectedShadow : normalShadow;
	}
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
Kinetic.Idea.prototype.setStyle = function (config) {
	'use strict';
	/*jslint newcap: true*/
	var isDroppable = this.isDroppable,
		isRoot = this.level === 1,
		isSelected = this.isSelected,
		background = this.getBackground(),
		tintedBackground = Color(background).mix(Color('#EEEEEE')).hexString(),
		luminosity = Color(tintedBackground).luminosity();
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
		background = '#EF6F6F';
	} else if (isSelected) {
		config.fill = background;
	} else {
		config.stroke = '#888';
		config.fill = {
			start: { x: 0, y: 0 },
			end: {x: 100, y: 100 },
			colorStops: [0, tintedBackground, 1, background]
		};
	}

	this.setupShadows(config);
	config.align = 'center';
	config.cornerRadius = 10;
	if (luminosity < 0.5) {
		config.textFill = '#EEEEEE';
	} else if (luminosity < 0.9) {
		config.textFill = '#4F4F4F';
	} else {
		config.textFill = '#000000';
	}
};
Kinetic.Idea.prototype.setMMStyle = function (newMMStyle) {
	'use strict';
	this.mmStyle = newMMStyle;
	this.setStyle(this.attrs);
	this.getLayer().draw();
};
Kinetic.Idea.prototype.getIsSelected = function () {
	'use strict';
	return this.isSelected;
};

Kinetic.Idea.prototype.setIsSelected = function (isSelected) {
	'use strict';
	this.isSelected = isSelected;
	this.setStyle(this.attrs);
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
	animation.func = transition._onEnterFrame.bind(transition);
	animation.node = this.getLayer();
	transition.onFinished = animation.stop.bind(animation);
	transition.start();
	animation.start();
};
Kinetic.Global.extend(Kinetic.Idea, Kinetic.Text);
