(function($) {

	//Make nodes selectable by expression
	$.extend($.expr[':'], { slider: "(' '+a.className+' ').indexOf(' ui-slider ') != -1" });

	$.fn.extend({
		slider: function(options) {
			return this.each(function() {
				if (typeof options == "string") {
					var slider = $.data(this, "ui-slider");
					slider[options].apply(slider, args);

				} else if(!$.data(this, "ui-slider"))
					new $.ui.slider(this, options);
			});
		}
	});
	
	$.ui.slider = function(element, options) {
		//Initialize needed constants
		var self = this;
		
		this.element = $(element);
		
		$.data(element, "ui-slider", this);
		this.element.addClass("ui-slider");
		
		//Prepare the passed options
		this.options = $.extend({}, options);
		var o = this.options;
		$.extend(o, {
			axis: o.axis || (element.offsetWidth < element.offsetHeight ? 'vertical' : 'horizontal'),
			maxValue: parseInt(o.maxValue) || 100,
			minValue: parseInt(o.minValue) || 0,
			startValue: parseInt(o.startValue) || 0		
		});
		o.stepping = parseInt(o.stepping) || (o.steps ? o.maxValue/o.steps : 0);
		
		$(element).bind("setData.slider", function(event, key, value){
			self.options[key] = value;
		}).bind("getData.slider", function(event, key){
			return self.options[key];
		});

		//Initialize mouse events for interaction
		this.handle = o.handle ? $(o.handle, element) : $('.ui-slider-handle', element);
		$(this.handle).mouseInteraction({
			executor: this,
			delay: o.delay,
			distance: o.distance || 0,
			dragPrevention: o.prevention ? o.prevention.toLowerCase().split(',') : ['input','textarea','button','select','option'],
			start: this.start,
			stop: this.stop,
			drag: this.drag,
			condition: function(e) { return !this.disabled; }
		});
		
		//Position the node
		if(o.helper == 'original' && (this.element.css('position') == 'static' || this.element.css('position') == ''))
			this.element.css('position', 'relative');
		
		if(o.axis == 'horizontal') {
			this.size = this.element.outerWidth();
			this.properties = ['left', 'width'];
		} else {
			this.size = this.element.outerHeight();
			this.properties = ['top', 'height'];
		}
		
		//Bind the click to the slider itself
		this.element.bind('click', function(e) { self.click.apply(self, [e]); });
		
		//Move the first handle to the startValue
		if(!isNaN(o.startValue)) this.moveTo(o.startValue, 0);
	
	};
	
	$.extend($.ui.slider.prototype, {
		plugins: {},
		ui: function(e) {
			return {
				instance: this,
				options: this.options					
			};
		},
		propagate: function(n,e) {
			$.ui.plugin.call(this, n, [e, this.ui()]);
			this.element.triggerHandler(n == "slide" ? n : "slide"+n, [e, this.ui()], this.options[n]);
		},
		destroy: function() {
			this.element
				.removeClass("ui-slider ui-slider-disabled")
				.removeData("ul-slider")
				.unbind(".slider");
			this.handles.removeMouseInteraction();
		},
		enable: function() {
			this.element.removeClass("ui-slider-disabled");
			this.disabled = false;
		},
		disable: function() {
			this.element.addClass("ui-slider-disabled");
			this.disabled = true;
		},
		click: function(e) {
			
			var pointer = [e.pageX,e.pageY];
			var clickedHandle = false;
			this.handle.each(function() { if(this == e.target) clickedHandle = true;  });
			if(clickedHandle || this.disabled) return;
			
			//Move focussed handle to the clicked position
			
				
		},
		start: function(e, handle) {
			
			var o = this.options;
			this.$handle = $(handle);
			
			this.offset = this.element.offset();
			this.handleOffset = this.$handle.offset();
			this.clickOffset = { top: e.pageY - this.handleOffset.top, left: e.pageX - this.handleOffset.left };
			this.handleSize = this.$handle['outer'+this.properties[1].substr(0,1).toUpperCase()+this.properties[1].substr(1)]();
			
			return false;
						
		},
		stop: function(e) {			
			
			var o = this.options;
			return false;
			
		},
		drag: function(e, handle) {

			var o = this.options;
			var position = { top: e.pageY - this.offset.top - this.clickOffset.top, left: e.pageX - this.offset.left - this.clickOffset.left};

			var modifier = position[this.properties[0]];
			if(modifier >= this.size - this.handleSize) modifier = this.size - this.handleSize;
			if(modifier <= 0) modifier = 0;
			
			this.$handle.css(this.properties[0], modifier);
			return false;
			
		},
		moveTo: function(value, handle) {	// renamed from goto to moveTo as goto is reserved javascript word
			

		}
	});

})(jQuery);