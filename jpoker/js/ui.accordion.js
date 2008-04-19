;(function($) {

$.fn.extend({
	accordion: function(settings, value) {
		return typeof settings == "string" ?
			this.trigger(settings + ".ui-accordion", [value]) :
			this.each(function() {
				$.data(this, "ui-accordion") || $.data(this, "ui-accordion", new $.ui.accordion(this, settings));
			});
	},
	// deprecated, use .accordion()
	makeAccordion: function() {
		return this.accordion.apply( this, arguments );
	},
	// deprecated, use .accordion("activate", index)
	changeAccordion: function(key, value) {
		return this.trigger(key + ".ui-accordion", [value]);
	},
	// deprecated, use .accordion("enable")
	enableAccordion: function() {
		return this.trigger("enable.ui-accordion");
	},
	// deprecated, use .accordion("disable")
	disableAccordion: function() {
		return this.trigger("disable.ui-accordion");
	},
	// deprecated, use .accordion("remove")
	removeAccordion: function() {
		return this.trigger("remove.ui-accordion");
	},
	// deprecated, use .accordion("activate", index)
	activate: function(index) {
		return this.changeAccordion("activate", index);
	},
	// deprecated, use .accordion("remove")
	unaccordion: function() {
		return this.removeAccordion.apply(this, arguments);
	}
});

// If the UI scope is not available, add it
$.ui = $.ui || {};

$.ui.accordion = function(container, settings) {
	
	// setup configuration
	this.settings = settings = $.extend({}, $.ui.accordion.defaults, settings);
	
	if ( settings.navigation ) {
		var current = $(container).find("a").filter(settings.navigationFilter);
		if ( current.length ) {
			if ( current.filter(settings.header).length ) {
				settings.active = current;
			} else {
				settings.active = current.parent().parent().prev();
				current.addClass("current");
			}
		}
	}
	
	// calculate active if not specified, using the first header
	settings.headers = $(container).find(settings.header);
	settings.active = findActive(settings.headers, settings.active);

	if ( settings.fillSpace ) {
		var maxHeight = $(container).parent().height();
		settings.headers.each(function() {
			maxHeight -= $(this).outerHeight();
		});
		var maxPadding = 0;
		settings.headers.next().each(function() {
			maxPadding = Math.max(maxPadding, $(this).innerHeight() - $(this).height());
		}).height(maxHeight - maxPadding);
	} else if ( settings.autoheight ) {
		var maxHeight = 0;
		settings.headers.next().each(function() {
			maxHeight = Math.max(maxHeight, $(this).outerHeight());
		}).height(maxHeight);
	}

	settings.headers
		.not(settings.active || "")
		.next()
		.hide();
	settings.active.parent().andSelf().addClass(settings.selectedClass);
	
	$(container)
	.bind((settings.event || "") + ".ui-accordion", clickHandler)
	.bind("activate.ui-accordion", activateHandler)
	.bind("enable.ui-accordion", function() {
		$.data(this, "ui-accordion").settings.disabled = false;
	})
	.bind("disable.ui-accordion", function() {
		$.data(this, "ui-accordion").settings.disabled = true;
	})
	.one("remove.ui-accordion", function() {
		var settings = $.data(this, "ui-accordion").settings;
		$(this)
		.unbind( settings.event + ".ui-accordion" )
		.unbind( "activate.ui-accordion" )
		.unbind( "enable.ui-accordion" )
		.unbind( "disable.ui-accordion" );
		settings.headers.next().css("display", "");
		if ( settings.fillSpace || settings.autoheight ) {
			settings.headers.next().css("height", "");
		}
		$.removeData(this, "ui-accordion");
	});
};

function scopeCallback(callback, scope) {
	return function() {
		return callback.apply(scope, arguments);
	};
}

function completed(cancel) {
	// if removed while animated data can be empty
	if (!$.data(this, "ui-accordion"))
		return;
	var settings = $.data(this, "ui-accordion").settings;
	settings.running = cancel ? 0 : --settings.running;
	if ( settings.running )
		return;
	if ( settings.clearStyle ) {
		settings.toShow.add(settings.toHide).css({
			height: "",
			overflow: ""
		});
	}
	$(this).trigger("changed.ui-accordion", settings.data);
}

function toggle(toShow, toHide, data, clickedActive, down) {
	var settings = $.data(this, "ui-accordion").settings;
	settings.toShow = toShow;
	settings.toHide = toHide;
	settings.data = data;
	var complete = scopeCallback(completed, this);
	
	// count elements to animate
	settings.running = toHide.size() == 0 ? toShow.size() : toHide.size();
	
	if ( settings.animated ) {
		if ( !settings.alwaysOpen && clickedActive ) {
			$.ui.accordion.animations[settings.animated]({
				toShow: jQuery([]),
				toHide: toHide,
				complete: complete,
				down: down,
				autoheight: settings.autoheight
			});
		} else {
			$.ui.accordion.animations[settings.animated]({
				toShow: toShow,
				toHide: toHide,
				complete: complete,
				down: down,
				autoheight: settings.autoheight
			});
		}
	} else {
		if ( !settings.alwaysOpen && clickedActive ) {
			toShow.toggle();
		} else {
			toHide.hide();
			toShow.show();
		}
		complete(true);
	}
}

function clickHandler(event) {
	var settings = $.data(this, "ui-accordion").settings;
	if (settings.disabled)
		return false;
	
	// called only when using activate(false) to close all parts programmatically
	if ( !event.target && !settings.alwaysOpen ) {
		settings.active.parent().andSelf().toggleClass(settings.selectedClass);
		var toHide = settings.active.next();
		var toShow = settings.active = $([]);
		toggle.call(this, toShow, toHide );
		return false;
	}
	// get the click target
	var clicked = $(event.target);
	
	// due to the event delegation model, we have to check if one
	// of the parent elements is our actual header, and find that
	if ( clicked.parents(settings.header).length )
		while ( !clicked.is(settings.header) )
			clicked = clicked.parent();
	
	var clickedActive = clicked[0] == settings.active[0];
	
	// if animations are still active, or the active header is the target, ignore click
	if (settings.running || (settings.alwaysOpen && clickedActive))
		return false;
	if (!clicked.is(settings.header))
		return;

	// switch classes
	settings.active.parent().andSelf().toggleClass(settings.selectedClass);
	if ( !clickedActive ) {
		clicked.parent().andSelf().addClass(settings.selectedClass);
	}

	// find elements to show and hide
	var toShow = clicked.next(),
		toHide = settings.active.next(),
		data = [clicked, settings.active, toShow, toHide],
		down = settings.headers.index( settings.active[0] ) > settings.headers.index( clicked[0] );
	
	settings.active = clickedActive ? $([]) : clicked;
	toggle.call(this, toShow, toHide, data, clickedActive, down );

	return false;
};

function activateHandler(event, index) {
	// IE manages to call activateHandler on normal clicks
	if ( arguments.length == 1 )
		return;
	// call clickHandler with custom event
	clickHandler.call(this, {
		target: findActive( $.data(this, "ui-accordion").settings.headers, index )[0]
	});
};

function findActive(headers, selector) {
	return selector != undefined
		? typeof selector == "number"
			? headers.filter(":eq(" + selector + ")")
			: headers.not(headers.not(selector))
		: selector === false
			? $([])
			: headers.filter(":eq(0)");
}

$.extend($.ui.accordion, {
	defaults: {
		selectedClass: "selected",
		alwaysOpen: true,
		animated: 'slide',
		event: "click",
		header: "a",
		autoheight: true,
		running: 0,
		navigationFilter: function() {
			return this.href.toLowerCase() == location.href.toLowerCase();
		}
	},
	animations: {
		slide: function(settings, additions) {
			settings = $.extend({
				easing: "swing",
				duration: 300
			}, settings, additions);
			if ( !settings.toHide.size() ) {
				settings.toShow.animate({height: "show"}, settings);
				return;
			}
			var hideHeight = settings.toHide.height(),
				showHeight = settings.toShow.height(),
				difference = showHeight / hideHeight;
			settings.toShow.css({ height: 0, overflow: 'hidden' }).show();
			settings.toHide.filter(":hidden").each(settings.complete).end().filter(":visible").animate({height:"hide"},{
				step: function(now) {
					var current = (hideHeight - now) * difference;
					if ($.browser.msie || $.browser.opera) {
						current = Math.ceil(current);
					}
					settings.toShow.height( current );
				},
				duration: settings.duration,
				easing: settings.easing,
				complete: function() {
					if ( !settings.autoheight ) {
						settings.toShow.css("height", "auto");
					}
					settings.complete();
				}
			});
		},
		bounceslide: function(settings) {
			this.slide(settings, {
				easing: settings.down ? "bounceout" : "swing",
				duration: settings.down ? 1000 : 200
			});
		},
		easeslide: function(settings) {
			this.slide(settings, {
				easing: "easeinout",
				duration: 700
			})
		}
	}
});

})(jQuery);
