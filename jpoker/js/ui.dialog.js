(function($) {

	//If the UI scope is not available, add it
	$.ui = $.ui || {};

	$.fn.extend({
		dialog: function(options, data) {
			var args = Array.prototype.slice.call(arguments, 1);

			return this.each(function() {
				if (typeof options == "string") {
					var dialog = $.data(this, "ui-dialog") ||
						$.data($(this).parents(".ui-dialog:first").find(".ui-dialog-content")[0], "ui-dialog");
					dialog[options].apply(dialog, args);

				// INIT with optional options
				} else if (!$(this).is(".ui-dialog-content"))
					new $.ui.dialog(this, options);
			});
		}
	});

	$.ui.dialog = function(el, options) {
		
		var defaults = {
			autoOpen: true,
			width: 300,
			height: 200,
			minWidth: 150,
			minHeight: 100,
			position: 'center',
			buttons: [],
			draggable: true,
			resizable: true
		};
		options = $.extend({}, defaults, options); //Extend and copy options
		this.element = el;
		var self = this; //Do bindings

		$.data(this.element, "ui-dialog", this);
		
		$(el).bind("setData.dialog", function(event, key, value){
			options[key] = value;
		}).bind("getData.dialog", function(event, key){
			return options[key];
		});

		var uiDialogContent = $(el).addClass('ui-dialog-content');

		if (!uiDialogContent.parent().length) {
			uiDialogContent.appendTo('body');
		}
		uiDialogContent
			.wrap(document.createElement('div'))
			.wrap(document.createElement('div'));
		var uiDialogContainer = uiDialogContent.parent().addClass('ui-dialog-container').css({position: 'relative'});
		var uiDialog = uiDialogContainer.parent().hide()
			.addClass('ui-dialog')
			.css({position: 'absolute', width: options.width, height: options.height, overflow: 'hidden'})
			.css("z-index", $('.ui-dialog:visible').size()); 

		var classNames = uiDialogContent.attr('className').split(' ');

		// Add content classes to dialog, to inherit theme at top level of element
		$.each(classNames, function(i, className) {
			if (className != 'ui-dialog-content')
				uiDialog.addClass(className);
		});
		
		if (options.resizable) {
			uiDialog.append("<div class='ui-resizable-n ui-resizable-handle'></div>")
				.append("<div class='ui-resizable-s ui-resizable-handle'></div>")
				.append("<div class='ui-resizable-e ui-resizable-handle'></div>")
				.append("<div class='ui-resizable-w ui-resizable-handle'></div>")
				.append("<div class='ui-resizable-ne ui-resizable-handle'></div>")
				.append("<div class='ui-resizable-se ui-resizable-handle'></div>")
				.append("<div class='ui-resizable-sw ui-resizable-handle'></div>")
				.append("<div class='ui-resizable-nw ui-resizable-handle'></div>");
			uiDialog.resizable({ maxWidth: options.maxWidth, maxHeight: options.maxHeight, minWidth: options.minWidth, minHeight: options.minHeight });
		}

		uiDialogContainer.prepend('<div class="ui-dialog-titlebar"></div>');
		var uiDialogTitlebar = $('.ui-dialog-titlebar', uiDialogContainer);
		var title = (options.title) ? options.title : (uiDialogContent.attr('title')) ? uiDialogContent.attr('title') : '';
		uiDialogTitlebar.append('<span class="ui-dialog-title">' + title + '</span>');
		uiDialogTitlebar.append('<div class="ui-dialog-titlebar-close"></div>');
		$('.ui-dialog-titlebar-close', uiDialogTitlebar)
			.hover(function() { $(this).addClass('ui-dialog-titlebar-close-hover'); }, 
			       function() { $(this).removeClass('ui-dialog-titlebar-close-hover'); })
			.mousedown(function(ev) {
				ev.stopPropagation();
			})
			.click(function() {
				self.close();
			});

		var l = 0;
		$.each(options.buttons, function() { l = 1; return false; });
		if (l == 1) {
			uiDialog.append('<div class="ui-dialog-buttonpane"></div>');
			var uiDialogButtonPane = $('.ui-dialog-buttonpane', uiDialog);
			$.each(options.buttons, function(name, value) {
				var btn = $(document.createElement('button')).text(name).click(value);
				uiDialogButtonPane.append(btn);
			});
		}
	
		if (options.draggable) {
			uiDialog.draggable({
				handle: '.ui-dialog-titlebar',
				start: function() {
					self.activate();
				}
			});
		}
		uiDialog.mousedown(function() {
			self.activate();
		});
		uiDialogTitlebar.click(function() {
			self.activate();
		});
	
		this.open = function() {
			uiDialog.appendTo('body');
			var wnd = $(window), doc = $(document), top = doc.scrollTop(), left = doc.scrollLeft();
			if (options.position.constructor == Array) {
				// [x, y]
				top += options.position[1];
				left += options.position[0];
			} else {
				switch (options.position) {
					case 'center':
						top += (wnd.height() / 2) - (uiDialog.height() / 2);
						left += (wnd.width() / 2) - (uiDialog.width() / 2);
						break;
					case 'top':
						top += 0;
						left += (wnd.width() / 2) - (uiDialog.width() / 2);
						break;
					case 'right':
						top += (wnd.height() / 2) - (uiDialog.height() / 2);
						left += (wnd.width()) - (uiDialog.width());
						break;
					case 'bottom':
						top += (wnd.height()) - (uiDialog.height());
						left += (wnd.width() / 2) - (uiDialog.width() / 2);
						break;
					case 'left':
						top += (wnd.height() / 2) - (uiDialog.height() / 2);
						left += 0;
						break;
					default:
						//center
						top += (wnd.height() / 2) - (uiDialog.height() / 2);
						left += (wnd.width() / 2) - (uiDialog.width() / 2);
				}
			}
			top = top < doc.scrollTop() ? doc.scrollTop() : top;
			uiDialog.css({top: top, left: left});
			uiDialog.show();
			self.activate();

			// CALLBACK: open
			var openEV = null;
			var openUI = {
				options: options
			};
			$(this.element).triggerHandler("dialogopen", [openEV, openUI], options.open);
		};

		this.activate = function() {
			var maxZ = curZ = 0;
			$('.ui-dialog:visible').each(function() {
				var z = parseInt($(this).css("z-index"));
				maxZ = z > maxZ ? z : maxZ;
			});
			uiDialog.css("z-index", maxZ + 1);
		};

		this.close = function() {
			uiDialog.hide();

			// CALLBACK: close
			var closeEV = null;
			var closeUI = {
				options: options
			};
			$(this.element).triggerHandler("dialogclose", [closeEV, closeUI], options.close);
		};
		
		if (options.autoOpen)
			this.open();

	}

})(jQuery);
