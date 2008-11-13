//
// Domain Public by Eric Wendelin http://eriwen.com/
//                  Luke Smith
//                  Loic Dachary <loic@dachary.org> (2008)
//                  Johan Euphrosine <proppy@aminche.com> (2008)
// http://pastie.org/253058
//
function printStackTrace() {
    return (new printStackTrace.implementation()).run();
};

printStackTrace.implementation = function() {};

printStackTrace.implementation.prototype = {
    run: function() {
        mode = this.mode();
        if(mode != 'other') {
            try {(0)()} catch (e) {
                return this[mode](e);
            }
        } else {
            return this.other(arguments.callee);
        }
    },

    mode: function() {
        var mode;
        try {(0)()} catch (e) {
            mode = e.stack ? 'firefox' : window.opera ? 'opera' : 'other';
        }
        return mode;
    },
    
    firefox: function(e) {
        return e.stack.replace(/^.*?\n/,'').
        replace(/(?:\n@:0)?\s+$/m,'').
        replace(/^\(/gm,'{anonymous}(').
        split("\n");
    },

    opera: function(e) {
        var lines = e.message.split("\n"),
        ANON = '{anonymous}',
        lineRE = /Line\s+(\d+).*?in\s+(http\S+)(?:.*?in\s+function\s+(\S+))?/i,
        i,j,len;

        for (i=4,j=0,len=lines.length; i<len; i+=2) {
            if (lineRE.test(lines[i])) {
                lines[j++] = (RegExp.$3 ?
                              RegExp.$3 + '()@' + RegExp.$2 + ':' + RegExp.$1 :
                              ANON + RegExp.$2 + ':' + RegExp.$1) +
                    ' -- ' + lines[i+1].replace(/^\s+/,'');
            }
        }

        lines.splice(j,lines.length-j);
        return lines;
    },

    other: function(curr) {
        var ANON = "{anonymous}",
        fnRE  = /function\s*([\w\-$]+)?\s*\(/i,
        stack = [],j=0,
        fn,args;

	var index = 1;
	var values = {};
        var replacer = function(key, value) {
            if(typeof this[key] == 'function') {
                return 'function';
            } else {
		if(values[value]) {
		    return '#' + values[values];
		} else {
		    values[value] = index++;
		}
                return value;
            }
        };

        while (curr) {
            fn    = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
	    args  = Array.prototype.slice.call(curr.arguments);
	    stack[j++] = fn + '(' + JSON.stringify(args, replacer) + ')';
            curr = curr.caller;
        }

        return stack;
    }
};


