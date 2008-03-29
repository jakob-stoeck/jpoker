//
//     Copyright (C) 2008 Johan Euphrosine <proppy@aminche.com>
//     Copyright (C) 2008 Loic Dachary <loic@dachary.org>
//     Copyright (C) 2008 Saq Imtiaz <lewcid@gmail.com>
//
//     This program is free software: you can redistribute it and/or modify
//     it under the terms of the GNU General Public License as published by
//     the Free Software Foundation, either version 3 of the License, or
//     (at your option) any later version.
//
//     This program is distributed in the hope that it will be useful,
//     but WITHOUT ANY WARRANTY; without even the implied warranty of
//     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//     GNU General Public License for more details.
//
//     You should have received a copy of the GNU General Public License
//     along with this program.  If not, see <http://www.gnu.org/licenses/>.
//

(function($) {

    $.fn.jpoker = function() {
        var args = Array.prototype.slice.call(arguments);
        var name = args.shift();
        $.jpoker.plugins[name].apply(this, args);
    };

    $.jpoker = {

        verbose: 0,

        serial: (new Date()).getTime(),

        servers: {},

        destructor: function() {
            $.each(this.servers,
                   function(key, value) {
                       value.destructor();
                   });
            this.servers = {};
        },

        now: function() { return (new Date()).getTime(); },

        uid: function() { return "jpoker" + $.jpoker.serial++ ; },

        message: function(str) {
            if(window.console) { window.console.log(str); }
        },

        error: function(reason) {
            this.errorHandler(reason);
            this.destructor();
            throw reason;
        },

        errorHandler: function(reason) {
            this.message(reason);
        },

        serverCreate: function(options) {
            this.servers[options.url] = new jpoker.server(options);
            return this.servers[options.url];
        },

        serverDestroy: function(url) {
            this.servers[url].destructor();
            delete this.servers[url];
        },

        url2server: function(options) {
	    if(!(options.url in this.servers)) {
		this.serverCreate(options);
	    }
	    return this.servers[options.url];
	}

    };

    var jpoker = $.jpoker;

    //
    // Abstract prototype for all objects that
    // call destroy and update callbacks
    //
    jpoker.watchable = function(options) {
        $.extend(this, jpoker.watchable.defaults, options);
        this.constructor();
    };

    jpoker.watchable.defaults = {
    };

    jpoker.watchable.prototype = {

        constructor: function() {
            this.setCallbacks();
        },

        destructor: function() {
            this.notifyDestroy();
            this.setCallbacks();
        },

        setCallbacks: function() {
            this.callbacks = {
                destroy: [],
                update: []
            };
        },

        notify: function(what, data) {
            var result = [];
            var l = this.callbacks[what];
            for(var i = 0; i < l.length; i++) {
                if(l[i](this, data)) {
                    result.push(l[i]);
                }
            }
            this.callbacks[what] = result;
        },

        notifyUpdate: function(data) { this.notify('update', data); },
        notifyDestroy: function(data) { this.notify('destroy', data); },

        register: function(what, callback) {
            if($.inArray(callback, this.callbacks[what]) < 0) {
                this.callbacks[what].push(callback);
            }
        },

        registerUpdate: function(callback) { this.register('update', callback); },
        registerDestroy: function(callback) { this.register('destroy', callback); },

        unregister: function(what, callback) {
            this.callbacks[what] = $.grep(this.callbacks[what],
                                          function(e, i) { return e != callback; });
        },

        unregisterUpdate: function(callback) { this.unregister('update', callback); },
        unregisterDestroy: function(callback) { this.unregister('destroy', callback); }

    };

    //
    // Abstract prototype to manage the communication with a single poker server
    //
    jpoker.connection = function(options) {
        $.extend(this, jpoker.connection.defaults, options);
        this.constructor();
    };

    jpoker.connection.defaults = $.extend({
            mode: "queue",
            url: '',
            async: true,
            lagmax: 60,
            pollFrequency:  100,
            pingFrequency: 5000,
            timeout: 10000,
            clearTimeout: function(id) { return window.clearTimeout(id); },
            setTimeout: function(cb, delay) { return window.setTimeout(cb, delay); },
            ajax: function(o) { return jQuery.ajax(o); }
        }, jpoker.watchable.defaults);

    jpoker.connection.prototype = $.extend({}, jpoker.watchable.prototype, {

            blocked: false,

            session: 'clear',

            state: 'disconnected',

            lag: 0,

            high: ['PacketPokerChat', 'PacketPokerMessage', 'PacketPokerGameMessage'],

            incomingTimer: -1,

            pingTimer: -1,

            constructor: function() {
                jpoker.watchable.prototype.constructor.call(this);
                this.handlers = {};
                this.queues = {};
                this.delays = {};
                this.init();
            },

            destructor: function() {
                this.blocked = true;
                jpoker.watchable.prototype.destructor.call(this);
                this.init();
            },

            clearSession: function() {
                this.session = 'clear';
            },

            createSession: function() {
                this.session = jpoker.serial++;
            },

            init: function() {
                this.clearTimeout(this.pingTimer);
                this.pingTimer = -1;
                this.clearTimeout(this.incomingTimer);
                this.incomingTimer = -1;
                // empty the outgoing queue
                jQuery([$.ajax_queue]).queue("ajax", []);
                // empty the incoming queue
                this.queues = {};
                this.delays = {};
                this.clearSession();
            },

            error: function(reason) {
                this.init();
                this.handlers = {};
                this.setState('disconnected');
                jpoker.error(reason);
            },

            setState: function(state) {
                if(this.state != state) {
                    this.state = state;
                    this.notifyUpdate({type: 'PacketState', state: state});
                }
            },

            connected: function() {
                return this.state == 'connected';
            },

            registerHandler: function(id, handler) {
                if(!(id in this.handlers)) {
                    this.handlers[id] = [];
                }
                this.handlers[id].push(handler);
            },

            unregisterHandler: function(id, handler) {
                this.handlers[id] = $.grep(this.handlers[id],
                                           function(e, i) { return e != handler; });
                if(this.handlers[id].length <= 0) {
                    delete this.handlers[id];
                }
            },

            handle: function(id, packet) {
                if(id in this.handlers) {
                    var $this = this;
                    this.handlers[id] = $.grep(this.handlers[id], function(element, index) {
                            try {
                                return element($this, id, packet);
                            } catch(e) {
                                $this.error(e);
                                return false; // error will throw anyways
                            }
                        });
                }
            },

            delayQueue: function(id, time) {
                this.delays[id] = time;
            },

            noDelayQueue: function(id) {
                if(id in this.delays) {
                    delete this.delays[id];
                }
            },

            // null => no delay
            handleDelay: function(id) {
                if(id in this.delays) {
                    return this.delays[id];
                } else {
                    return null;
                }
            },

            sendPacket: function(packet) {
                var $this = this;
                var args = {
                    async: this.async,
                    data: JSON.stringify(packet),
                    mode: this.mode,
                    timeout: this.timeout,
                    url: this.url + '?session=' + this.session,
                    type: "POST",
                    dataType: "json",
                    global: false, // do not fire global events
                    success: function(data, status) {
                        if($this.state != 'connected') {
                            if($this.pinging()) {
                                $this.createSession();
                            }
                            $this.setState('connected');
                        }
                        $this.queueIncoming(data);
                    },
                    error: function(xhr, status, error) {
                        if(status == "timeout") {
                            $this.setState('disconnected');
                            $this.init();
                        } else {
                            $this.error({ xhr: xhr,
                                          status: status,
                                          error: error
                                });
                        }
                    }
                };
                this.ajax(args);
            },

            ping: function() {
                if(jQuery([$.ajax_queue]).queue("ajax").length <= 0) {
                    this.sendPacket({ type: "PacketPing" });
                }
                this.clearTimeout(this.pingTimer);
                var $this = this;
                this.pingTimer = this.setTimeout(function() {
                        $this.ping();
                    }, this.pingFrequency);
            },

            pinging: function() { return this.pingTimer >= 0; },

            queueIncoming: function(packets) {
                if(!this.blocked) {
                    for(var i = 0; i < packets.length; i++) {
                        packet = packets[i];
                        if("session" in packet) {
                            delete packet.session;
                        }
                        packet.time__ = jpoker.now();
                        var id;
                        if("game_id" in packet) {
                            id = packet.game_id;
                        } else {
                            id = 0;
                        }
                        if(!(id in this.queues)) {
                            this.queues[id] = { 'high': {'packets': [],
                                                         'delay': 0 },
                                                'low': {'packets': [],
                                                        'delay': 0 } };
                        }
                        if(jQuery.inArray(packet.type, this.high) >= 0) {
                            queue = this.queues[id].high;
                        } else {
                            queue = this.queues[id].low;
                        }
                        queue.packets.push(packet);
                    }
                    this.clearTimeout(this.incomingTimer);
                    var $this = this;
                    this.incomingTimer = this.setTimeout(function() {
                            $this.dequeueIncoming(); },
                        this.pollFrequency);
                }
            },

            dequeueIncoming: function() {
                if(!this.blocked) {
                    now = jpoker.now();
                    this.lag = 0;
                    for(var id in this.queues) {
                        for(var priority in this.queues[id]) {
                            queue = this.queues[id][priority];
                            if(queue.packets.length <= 0) {
                                continue;
                            }
                            lag = now - queue.packets[0].time__;
                            this.lag = this.lag > lag ? this.lag : lag;
                            if(queue.delay > now && lag > this.lagmax) {
                                queue.delay = 0;
                            }
                            if(queue.delay <= now) {
                                delay = this.handleDelay(id);
                                if(lag > this.lagmax || delay === null || delay <= now) {
                                    packet = queue.packets.shift();
                                    delete packet.time__;
                                    this.handle(id, packet);
                                } else {
                                    queue.delay = delay;
                                }
                            } else if(jpoker.verbose > 0) {
                                this.message("wait for " + queue.delay / 1000.0 + "s for queue " + id);
                            }
                        }
                        //
                        // get rid of queues with no associated delay AND no pending packets
                        //
                        queue = this.queues[id];
                        if(queue.high.packets.length <= 0 && queue.low.packets.length <= 0) {
                            if(queue.high.delay <= now && queue.low.delay <= now) {
                                delete this.queues[id];
                            }
                        }
                    }
                }
                var empty = true;
                for(var j in this.queues) {
                    empty = false;
                    break;
                }
                this.clearTimeout(this.incomingTimer);
                if(!empty) {
                    var $this = this;
                    this.incomingTimer = this.setTimeout(function() {
                            $this.dequeueIncoming(); },
                        this.pollFrequency);
                }
            }

        });

    //
    // server
    //
    jpoker.server = function(options) {
        $.extend(this, jpoker.server.defaults, options);
        jpoker.connection.prototype.constructor.call(this);
        this.constructor();
    };

    jpoker.server.defaults = $.extend({
	    playersCount: null,
	    tablesCount: null,
            setInterval: function(cb, delay) { return window.setInterval(cb, delay); },
            clearInterval: function(id) { return window.clearInterval(id); }
        }, jpoker.connection.defaults);

    jpoker.server.prototype = $.extend({}, jpoker.connection.prototype, {
            constructor: function() {
                jpoker.connection.prototype.constructor.call(this);
                this.tables = {};
                this.timers = {};
                this.serial = 0;
                this.logname = null;
            },

            destructor: function() {
                var $this = this;
                $.each(this.timers, function(key, value) {
                        $this.clearInterval(value.timer);
                    });
                jpoker.connection.prototype.destructor.call(this);
            },

            refresh: function(tag, request, handler, options) {
                if(tag in this.timers) {
                    this.clearInterval(this.timers[tag].timer);
                } else {
                    this.timers[tag] = {};
                }
                this.timers[tag].timer = jpoker.refresh(this, request, handler, options);
            },

            refreshTables: function(string, options) {

                if(!(string in this.tables)) {
                    this.tables[string] = {};
                }

                var request = function(server) {
                    server.sendPacket({
                            "type": "PacketPokerTableSelect",
                            "string": string
                        });
                };

                var handler = function(server, packet) {
                    var info = server.tables && server.tables[string];
                    if(packet.type == "PacketPokerTableList") {
                        info.packet = packet;
			server.playersCount = packet.players;
			server.tablesCount = packet.tables;
                        server.notifyUpdate(packet);
                    }
                    return true;
                };

                this.refresh('tableList', request, handler, options);
            },

            loggedIn: function() {
                return this.serial !== 0;
            },

            login: function(name, password) {
                if(this.serial != 0) {
                    throw this.url + " attempt to login " + name + " although serial is " + this.serial + " instead of 0";
                }
                this.sendPacket({
                        "type" : "PacketLogin",
                        "name": name,
                        "password": password
                    });
                this.ping();
                var answer = function(server, packet) {
                    switch(packet.type) {
                    case "PacketSerial":
                    server.serial = packet.serial;
                    break;

                    case "PacketError":
                    break;
                    } 
                };
                this.registerHandler(0, answer);
            },

            logout: function() {
                this.serial = 0;
                this.sendPacket({ type: "PacketLogout" });
            }
        });

    //
    // table
    //
    jpoker.table = function(options) {
        $.extend(this, jpoker.table.defaults, options);
    };

    jpoker.table.defaults = {

    };

    jpoker.table.prototype = $.extend({}, jpoker.watchable.prototype, {
        seats: [],
        board: [],
        pots: [ null, null, null, null, null,
                null, null, null, null, null ]
        });

    //
    // player
    //

    jpoker.player = function(options) {
        $.extend(this, jpoker.player.defaults, options);
    };

    jpoker.player.defaults = {

    };

    jpoker.player.prototype = $.extend({}, jpoker.watchable.prototype, {
        money: 0,
        bet: 0,
        cards: []
        });

    //
    // Refresh data with the "handler" function after sending
    // a packet to the "url" poker server with the "request" function.
    //
    jpoker.refresh = function(server, request, handler, options) {

        var opts = $.extend({}, this.refresh.defaults, options);

        var waiting = false;

        var time_sent = jpoker.now();

        var timer = 0;

        var url = server.url;

        var callback = function() {
            var server = jpoker.url2server({ url: url }); // check if server still exists when the callback runs
            if(opts.requireSession === false || server.connected()) {
                if(waiting) {
                    if(( jpoker.now() - time_sent ) > opts.timeout) {
			opts.clearInterval(timer);
                        server.error(server.url + " timed out after " + (jpoker.now() - time_sent) + " seconds trying to update url " + url);
                    }
                } else {
                    time_sent = jpoker.now();
                    waiting = true;
                    request(server);
                }
                return true;
            } else {
                opts.clearInterval(timer);
                return false;
            }
        };

        if(callback()) {

            timer = opts.setInterval(callback, opts.delay);

            var cb = function(server, game_id, packet) {
                waiting = false;
                return handler(server, packet);
            };

            server.registerHandler(opts.game_id, cb, opts);
        }

        return timer;
    };

    jpoker.refresh.defaults = {
        delay: 120000,
        timeout: 5000, // must be lower than jpoker.connection timeout otherwise it will 
                       // never fire
        game_id: 0,
        requireSession: false,

        setInterval: function(cb, delay) { return window.setInterval(cb, delay); },
        clearInterval: function(id) { return window.clearInterval(id); }
    };

    //
    // jQuery plugin container (must only contain jQuery plugins)
    //
    jpoker.plugins = {};

    jpoker.plugins.tableList = function(url, options) {
        var tableList = jpoker.plugins.tableList;

        var opts = $.extend({}, tableList.defaults, options);

        var server = jpoker.url2server({ url: url });

        return this.each(function() {
                var $this = $(this);

                var id = jpoker.uid();

                $this.append('<table class="jpokerTableList" id="' + id + '"></table>');

                var updated = function(server, packet) {
                    var element = document.getElementById(id);
                    if(element) {
                        if(packet && packet.type == "PacketPokerTableList") {
                            $(element).html(tableList.getHTML(packet));
                        }
                        return true;
                    } else {
                        return false;
                    }
                };

                server.registerUpdate(updated);

                server.refreshTables(opts.string, options);

                return this;
            });
    };

    jpoker.plugins.tableList.defaults = $.extend({
        string: ''
        }, jpoker.refresh.defaults, jpoker.defaults);

    jpoker.plugins.tableList.getHTML = function(packet) {
        var t = this.templates;
        var html = [];
        html.push(t.header);
        for(var i = 0; i < packet.packets.length; i++) {
            var subpacket = packet.packets[i];
            var rowHTML = t.rows;
            $.each(subpacket, function(n,val){
                    rowHTML = rowHTML.replace('\%'+n,val);
                });
            html.push(rowHTML.replace('\%class',(i%2? 'evenRow':'oddRow')));
        }
        html.push(t.footer);
        return html.join('\n');
    };

    jpoker.plugins.tableList.templates = {
        header : '<thead><tr><td>Name</td><td>Players</td><td>Seats</td><td>Betting Structure</td><td>Average Pot</td><td>Hands/Hour</td><td>%Flop</td></tr></thead><tbody>',
        rows : '<tr class="%class"><td>%name</td><td>%players</td><td>%seats</td><td>%betting_structure</td><td>%average_pot</td><td>%hands_per_hour</td><td>%percent_flop</td></tr>',
        footer : '</tbody>'
    };

    jpoker.plugins.serverStatus = function(url, options) {
        var serverStatus = jpoker.plugins.serverStatus;

        var opts = $.extend({}, serverStatus.defaults, options);

        var server = jpoker.url2server({ url: url });

        return this.each(function() {
                var $this = $(this);

                var id = jpoker.uid();

                $this.append('<div class="jpokerServerStatus" id="' + id + '"></div>');

                var updated = function(server) {
                    var element = document.getElementById(id);
                    if(element) {
			$(element).html(serverStatus.getHTML(server));
                        return true;
                    } else {
                        return false;
                    }
                };

                if(updated(server)) {
                    server.registerUpdate(updated);
                }

                return this;
            });
    };

    jpoker.plugins.serverStatus.defaults = $.extend({
        }, jpoker.defaults);

    jpoker.plugins.serverStatus.getHTML = function(server) {
        var t = this.templates;
	var html = [];
	html.push(t.url.replace('%url', server.url));
	if(server.connected()) {
	    html.push(t.connected);
	} else {
	    html.push(t.disconnected);
	}
	if(server.playersCount !== null) {
	    html.push(t.players.replace('%players', server.playersCount));
	}
	if(server.tablesCount !== null) {
	    html.push(t.tables.replace('%tables', server.tablesCount));
	}
        return html.join('\n');
    };

    jpoker.plugins.serverStatus.templates = {
	url: ' %url ',
	disconnected: ' disconnected ',
	connected: ' connected ',
        players: ' %players players ',
        tables: ' %tables tables '
    };

    jpoker.plugins.login = function(url, options) {
 
        var opts = $.extend({}, jpoker.plugins.login.defaults, options);

        var server = jpoker.url2server({ url: url });

        return this.each(function() {
                var $this = $(this);

                var id = jpoker.uid();

                $this.append('<div class="jpokerLogin" id="' + id + '"></div>');

                var updated = function(server) {
                    var element = document.getElementById(id);
                    if(element) {
			var e = $(element);
                        e.html($this.getHTML(server));
                        if(server.loggedIn()) {
                            $("#logout", element).click(function() {
                                    var server = jpoker.url2server({ url: url });
                                    if(server.loggedIn()) {
                                        server.sendPacket({ "type": "PacketLogout" });
                                        $("#" + id + " > #logout").html("logout in progress");
                                    }
                                });
                        } else {
                            var login = $("#login", element);
                            var action = function() {
                                var name = $("#name", login).text();
                                var password = $("#password", login).text();
                                jpoker.url2server({ url: url }).login(name, password);
                                $("#" + id + " > #login").html("login in progress");
                            };
                            login.click(action);
                            login.keypress(function(e) {
                                    if(e.which == 13) {
                                        action.call(this);
                                    }
                                });
                        }
                        return true;
                    } else {
                        return false;
                    }
                };

                if(updated(server)) {
                    server.registerUpdate(updated);
                }

                return this;
            });
    };

    jpoker.plugins.login.defaults = $.extend({
        }, jpoker.defaults);

    jpoker.plugins.login.getHTML = function(server) {
        var t = this.templates;
	var html = [];
	if(server.loggedIn()) {
	    html.push(t.logout.replace('%player', server.logname));
	} else {
	    html.push(t.login);
	}
        return html.join('\n');
    };

    jpoker.plugins.login.templates = {
	login: '<div id="login">login: <input type="text" id="name" size="10" />, password: <input type="password" id="password" size="10" /> </div>',
	logout: '<div id="logout">%player logout<div>'
    };

})(jQuery);
