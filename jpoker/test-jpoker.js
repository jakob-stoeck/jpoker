//
//     Copyright (C) 2008 Loic Dachary <loic@dachary.org>
//     Copyright (C) 2008 Johan Euphrosine <proppy@aminche.com>
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
module("jpoker");

var jpoker = $.jpoker;

test("jpoker: unique id generation test", function() {
        expect(2);
        jpoker.serial = 1;
        equals(jpoker.uid(), "jpoker1");
        equals(jpoker.uid(), "jpoker2");
    });

test("jpoker.refresh", function(){
        expect(13);

        var clock = 1;
        jpoker.now = function() { return clock++; }

        var error_occurred = 0;

        var request_sent = false;
        var request = function(server) {
            equals(server.connected(), true, 'request1');
            request_sent = true;
        };
        var handler_called = false;
        var handler = function(server, packet) {
            equals(server, 'server', 'handler1');
            equals(packet, 'packet', 'handler2');
            handler_called = true;
        };
        var interval_callback = null;
        var setInterval = function(callback, delay) {
            equals(callback(), true, 'setInterval1');
            equals(delay, jpoker.refresh.defaults.delay, 'setInterval2');
            interval_callback = callback;
            return 42;
        };
        var clearInterval = function(id) {
            equals(id == 42 || id == 0, true, "id == 42 or 0");
        };
        jpoker.servers['url'] = {
            url: 'url',

            connected: function() {
                return true;
            },

            error: function() {
                error_occurred++;
            },

            registerHandler: function(game_id, cb, opts) {
                equals(game_id, 1, 'registerHandler');
                cb('server', game_id, 'packet');
            }
        };
        //
        // "request" is called once. The setInterval fires immediately
        // and fails because refresh is in wait state and timeout (set to 0)
        // exired.
        //
        result = jpoker.refresh(jpoker.servers['url'], request, handler,
                                {
                                    game_id: 1,
                                    timeout: 0,
                                    setInterval: setInterval,
                                    clearInterval: clearInterval
                                });
        equals(result, 42, 'first call');
        equals(request_sent, true, 'first call request');
        equals(handler_called, true, 'first call handler');
        equals(error_occurred, 1, 'first call error');
        jpoker.servers = {}; // destroy fake server
        equals(interval_callback(), false, 'second call 1');
    });

//
// jpoker.watchable
//
test("jpoker.watchable", function(){
        expect(4);
        var watchable = new jpoker.watchable({});
        var stone = 0;
        var callback = function(what, data) {
            stone += data;
            return true;
        };
        watchable.registerUpdate(callback);
        watchable.registerDestroy(callback);
        watchable.notifyUpdate(1);
        equals(stone, 1, "notifyUpdate");
        watchable.notifyDestroy(1);
        equals(stone, 2, "notifyDestroy");
        watchable.unregisterUpdate(callback);
        watchable.unregisterDestroy(callback);
        watchable.notifyUpdate(10);
        equals(stone, 2, "notifyUpdate (noop)");
        watchable.notifyDestroy(20);
        equals(stone, 2, "notifyDestroy (noop)");
    });

//
// jpoker.connection
//
test("jpoker.connection:ping", function(){
        expect(3);
        stop();
        var self = new jpoker.connection({
                pingFrequency: 30 // be carefull not to launch faster than jQuery internal timer
            });
        equals(self.state, 'connecting');
        var ping_count = 0;
        self.registerUpdate(function(server, data) {
                equals(server.state, 'connected');
                if(++ping_count >= 2) {
                    server.reset();
                    start();
                } else {
                    server.state = 'connecting';
                }
                return true;
            });
    });

test("jpoker.connection:sendPacket error", function(){
        expect(1);
        stop();
        var self = new jpoker.connection({
                doPing: false
            });
        
        error = jpoker.error
        jpoker.error = function(reason) {
            jpoker.error = error
            equals(reason.xhr.status, 404);
            start();
        };
        XMLHttpRequest.defaults.status = 404;
        self.sendPacket({type: 'type'});
        XMLHttpRequest.defaults.status = 200;
    });

test("jpoker.connection:sendPacket timeout", function(){
        expect(2);
        stop();
        var self = new jpoker.connection({
                doPing: false,
                timeout: 1
            });
        
        self.init = function() {
            equals(this.state, 'connected');
            jpoker.connection.prototype.init.call(this);
            equals(this.state, 'connecting');
            start();
        };
        self.state = 'connected';
        XMLHttpRequest.defaults.timeout = true;
        self.sendPacket({type: 'type'});
        XMLHttpRequest.defaults.timeout = false;
    });

test("jpoker.connection:sendPacket ", function(){
        expect(5);
        var self = new jpoker.connection({
                doPing: false,
                async: false,
                mode: null
            });

        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: '',

            handle: function(packet) {
                this.outgoing = "[ " + packet + " ]";
            }
        };

        XMLHttpRequest.prototype.server = new PokerServer();

        var clock = 1;
        jpoker.now = function() { return clock++; }
        self.clearTimeout = function(id) { };
        self.setTimeout = function(cb, delay) {
            return cb();
        };

        var handled;
        var handler = function(server, id, packet) {
            handled = [ server, id, packet ];
        };
        self.registerHandler(0, handler);

        var type = 'type1';
        var packet = {type: type};

        equals(self.connected(), false, "disconnected()");
        self.sendPacket(packet);

        equals(handled[0], self);
        equals(handled[1], 0);
        equals(handled[2].type, type);
        equals(self.connected(), true, "connected()");
    });

test("jpoker.connection:dequeueIncoming clearTimeout", function(){
        expect(1);
        var self = new jpoker.connection({ doPing: false });

        var cleared = false;
        self.clearTimeout = function(id) { cleared = true; };
        self.setTimeout = function(cb, delay) { throw "setTimeout"; };
        
        self.dequeueIncoming();

        ok(cleared, "cleared");
    });

test("jpoker.connection:dequeueIncoming setTimeout", function(){
        expect(2);
        var self = new jpoker.connection({ doPing: false });

        var clock = 1;
        jpoker.now = function() { return clock++; }
        var timercalled = false;
        self.clearTimeout = function(id) { };
        self.setTimeout = function(cb, delay) { timercalled = true; };

        // will not be deleted to preserve the delay
        self.queues[0] = { 'high': {'packets': [],
                                    'delay':  500 },
                           'low': {'packets': [],
                                   'delay': 0 } }
        // will be deleted because it is empty
        self.queues[1] = { 'high': {'packets': [],
                                    'delay':  0 },
                           'low': {'packets': [],
                                   'delay': 0 } }
        self.dequeueIncoming();

        ok(!(1 in self.queues));
        ok(timercalled);
    });

test("jpoker.connection:dequeueIncoming handle", function(){
        expect(6);
        var self = new jpoker.connection({ doPing: false });

        self.clearTimeout = function(id) { };

        var packet = { type: 'type1', time__: 1 };
        self.queues[0] = { 'high': {'packets': [],
                                    'delay':  0 },
                           'low': {'packets': [packet],
                                   'delay': 0 } }
        var handled;
        var handler = function(com, id, packet) {
            handled = [ com, id, packet ];
        };
        self.registerHandler(0, handler);
        self.dequeueIncoming();
        self.unregisterHandler(0, handler);

        equals(self.queues[0], undefined);

        equals(handled[0], self);
        equals(handled[1], 0);
        equals(handled[2], packet);

        equals(self.handlers[0], undefined);

        equals(("time__" in packet), false);
    });

test("jpoker.connection:dequeueIncoming handle error", function(){
        expect(1);
        stop();
        var self = new jpoker.connection({ doPing: false });

        var packet = { type: 'type1', time__: 1 };
        self.queues[0] = { 'high': {'packets': [],
                                    'delay':  0 },
                           'low': {'packets': [packet],
                                   'delay': 0 } }
        var handler = function(com, id, packet) {
            throw "the error";
        };
        self.error = function(reason) {
            equals(reason, "the error");
            start();
        }
        self.registerHandler(0, handler);
        self.dequeueIncoming();
    });

test("jpoker.connection:dequeueIncoming delayed", function(){
        expect(6);
        var self = new jpoker.connection({ doPing: false });

        var clock = 1;
        jpoker.now = function() { return clock++; }
        self.clearTimeout = function(id) { };

        var packet = { type: 'type1', time__: 1 };
        var delay = 10;
        self.delayQueue(0, delay);
        equals(self.delays[0], delay);
        self.queues[0] = { 'high': {'packets': [],
                                    'delay':  0 },
                           'low': {'packets': [packet],
                                   'delay': 0 } }
        self.dequeueIncoming();
        equals(self.queues[0].low.packets[0], packet);
        equals(self.queues[0].low.delay, delay);

        var message = false;
        jpoker.verbose = 1;
        self.message = function(str) { message = true; }
        self.dequeueIncoming();
        equals(self.queues[0].low.delay, delay);
        equals(message, true, "message");

        self.noDelayQueue(0);
        equals(self.delays[0], undefined, "delays[0]");

        self.queues = {};
    });

test("jpoker.connection:dequeueIncoming lagmax", function(){
        expect(4);
        var self = new jpoker.connection({ doPing: false });

        var clock = 10;
        jpoker.now = function() { return clock++; }
        self.lagmax = 5;
        self.clearTimeout = function(id) { };

        var packet = { type: 'type1', time__: 1 };
        self.queues[0] = { 'high': {'packets': [],
                                    'delay':  0 },
                           'low': {'packets': [packet],
                                   'delay': 50 } }
        var handled;
        var handler = function(com, id, packet) {
            handled = [ com, id, packet ];
        };
        self.registerHandler(0, handler);
        self.dequeueIncoming();
        self.unregisterHandler(0, handler);
        equals(handled[0], self);
        equals(handled[1], 0);
        equals(handled[2], packet);

        equals(self.handlers[0], undefined);
    });

test("jpoker.connection:queueIncoming", function(){
        expect(4);
        var self = new jpoker.connection({ doPing: false });

        var high_type = self.high[0];
        var packets = [
                       {'type': 'PacketType1'},
                       {'type': 'PacketType2', 'session': 'TWISTED_SESION'},
                       {'type': 'PacketType3', 'game_id': 1},
                       {'type': high_type, 'game_id': 1}
                       ];
        self.queueIncoming(packets);
        equals(self.queues[0].low.packets[0].type, 'PacketType1');
        equals(self.queues[0].low.packets[1].type, 'PacketType2');
        equals(self.queues[1].low.packets[0].type, 'PacketType3');
        equals(self.queues[1].high.packets[0].type, high_type);

        self.queues = {};
    });

var XMLHttpRequest = function(options) {
    $.extend(this, XMLHttpRequest.defaults, options);
    this.headers = [];
};

XMLHttpRequest.defaults = {
    readyState: 4,
    timeout: false,
    status: 200,
};

XMLHttpRequest.prototype = {

    responseText: "[]",

    open: function(type, url, async) {
        //window.console.log(url);
    },
    
    setRequestHeader: function(header) {
        this.headers.push(header);
    },
    
    getResponseHeader: function(header) {
        if(header == "content-type") {
            return "text/plain";
        } else {
            return null;
        }
    },

    abort: function() {
    },

    send: function(data) {
        if('server' in this && !this.timeout && this.status == 200) {
            this.server.handle(data);
            this.responseText = this.server.outgoing;
        }
    }
};

var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": [{"observers": 1, "name": "One", "percent_flop" : 98, "average_pot": 1535, "seats": 10, "variant": "holdem", "hands_per_hour": 220, "betting_structure": "2-4-limit", "currency_serial": 1, "muck_timeout": 5, "players": 4, "waiting": 0, "skin": "default", "id": 100, "type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Two", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 101,"type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Three", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-pot-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 102,"type": "PacketPokerTable", "player_timeout": 60}]};

test("jpoker.TableList", function(){
        expect(1);
        stop();

        //
        // Mockup server that will always return TABLE_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TABLE_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        XMLHttpRequest.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({
                url: 'url',
                doPing: false
            });
        server.state = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
        place.jpoker('tableList', 'url', { delay: 30 });
        server.registerUpdate(function(server, data) {
                var tr = $("#" + id + " tr", place);
                equals(tr.length, 4);
                $("#" + id, place).remove();
                jpoker.servers = {};
                start();
                return false;
            });
    });

