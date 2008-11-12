//
// Domain Public by Eric Wendelin http://eriwen.com/
//                  Luke Smith
//                  Loic Dachary <loic@dachary.org> (2008)
//                  Johan Euphrosine <proppy@aminche.com> (2008)
// http://pastie.org/253058
//
var printStackTrace = function(e, mode) {
    if(!mode) {
        mode = this.mode();
    }
    if(mode != 'other') {
        try {(0)()} catch (e) {
            return this[mode](e);
        }
    } else {
        return this.other();
    }
};

printStackTrace.prototype = {
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
                              RegExp.$3 + '()@' + RegExp.$2 + RegExp.$1 :
                              ANON + RegExp.$2 + ':' + RegExp.$1) +
                    ' -- ' + lines[i+1].replace(/^\s+/,'');
            }
        }

        lines.splice(j,lines.length-j);
        return lines;
    },

    other: function() {
        var curr  = arguments.callee.caller,
        FUNC  = 'function', ANON = "{anonymous}",
        fnRE  = /function\s*([\w\-$]+)?\s*\(/i,
        quoteRE = new RegExp('\"', 'g'),
        stack = [],j=0,
        fn,args,i;

        while (curr) {
            fn    = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
            args  = Array.prototype.slice.call(curr.arguments);
            i     = args.length;

            while (i--) {
                switch (typeof args[i]) {
                case 'string'  : 
                    args[i] = '"'+args[i].replace(quoteRE,'\\"')+'"'; 
                    break;
                case 'function': 
                    args[i] = FUNC;
                    break;
                }
            }

            if (args && typeof args == 'array') {
                args = args.join();
            } else {
                args = JSON.stringify(args);
            }
            stack[j++] = fn + '(' + args + ')';
            curr = curr.caller;
        }

        return stack;
    }
};


