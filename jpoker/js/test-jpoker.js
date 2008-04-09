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

try {
    console.profile();
} catch(e) {}

if(!window.ActiveXObject) {
    window.ActiveXObject = true;
}

var ActiveXObject = function(options) {
    $.extend(this, ActiveXObject.defaults, options);
    this.headers = [];
};

ActiveXObject.defaults = {
    readyState: 4,
    timeout: false,
    status: 200
};

ActiveXObject.prototype = {

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
        if('server' in this && this.server && !this.timeout && this.status == 200) {
            this.server.handle(data);
            this.responseText = this.server.outgoing;
        }
    }
};

test("String.supplant", function() {
        expect(1);
        equals("{a}".supplant({'a': 'b'}), 'b');
    });

var jpoker = $.jpoker;

jpoker.verbose = 100; // activate the code parts that depends on verbosity

//
// jpoker
//
test("jpoker: unique id generation test", function() {
        expect(2);
        jpoker.serial = 1;
        equals(jpoker.uid(), "jpoker1");
        equals(jpoker.uid(), "jpoker2");
    });

test("jpoker.url2hash", function(){
        expect(1);
        equals(jpoker.url2hash('url'), jpoker.url2hash('url'), "url2hash");
    });

test("jpoker.refresh", function(){
        expect(2);
        stop();

        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: '[{"type": "packet"}]',

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        var request_sent = false;
        var request = function(server) {
            server.sendPacket({'type': 'packet'});
        };
        var timer = 0;
        var handler = function(server, packet) {
            equals(packet.type, 'packet');
            equals(timer !== 0, true, 'timer');
            window.clearInterval(timer);
            delete ActiveXObject.prototype.server;
            start();
        };
        timer = jpoker.refresh(server, request, handler);

    });

test("jpoker.refresh requireSession", function(){
        expect(1);

        var server = jpoker.serverCreate({ url: 'url' });

        equals(jpoker.refresh(server, null, null, { requireSession: true }), 0, 'requireSession');

    });

//
// jpoker.server
//
test("jpoker.server.login: ok", function(){
        expect(9);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        equals(server.loggedIn(), false);
        equals(server.pinging(), false);

        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: '[{"type": "PacketAuthOk"}, {"type": "PacketSerial", "serial": 1}]',

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var logname = "name";
        equals(server.session, 'clear', "does not have session");
        server.login(logname, "password");
        server.registerUpdate(function(server, packet) {
                switch(packet.type) {
                case "PacketSerial":
                    equals(server.loggedIn(), true, "loggedIn");
                    equals(server.logname, logname, "logname");
                    equals(server.pinging(), true, "pinging");
                    equals(server.session != 'clear', true, "has session");
                    equals(server.connected(), true, "connected");
                    start();
                    return false;

                case "PacketState":
                    equals(server.connected(), true, "connected");
                    return true;

                default:
                    fail("unexpected packet type " + packet.type);
                    return false;
                }
            });
    });

test("jpoker.server.login: refused", function(){
        expect(1);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });

        var PokerServer = function() {};

        var refused = "not good";
        PokerServer.prototype = {
            outgoing: '[{"type": "PacketAuthRefused", "message": "' + refused + '"}]',

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        dialog = jpoker.dialog;
        jpoker.dialog = function(message) {
            equals(message.indexOf(refused) >= 0, true, "refused");
            jpoker.dialog = dialog;
            start();
        };
        server.login("name", "password");
    });

test("jpoker.server.login: already logged", function(){
        expect(1);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });

        var PokerServer = function() {};

        var refused = "not good";
        PokerServer.prototype = {
            outgoing: '[{"type": "PacketError", "other_type": ' + jpoker.packetName2Type.LOGIN + ' }]',

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        dialog = jpoker.dialog;
        jpoker.dialog = function(message) {
            equals(message.indexOf("already logged") >= 0, true, "already logged");
            jpoker.dialog = dialog;
            start();
        };
        server.login("name", "password");
    });

test("jpoker.server.login: serial is set", function(){
        expect(2);

        var server = jpoker.serverCreate({ url: 'url' });
        server.serial = 1;
        var caught = false;
        try { 
            server.login("name", "password");
        } catch(error) {
            equals(error.indexOf("serial is") >= 0, true, "serial is set");
            caught = true;
        }
        equals(caught, true, "caught is true");

        server.serial = 0;
    });

test("jpoker.server.logout", function(){
        expect(5);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        server.serial = 1;
        server.serial = "logname";
        server.state = "connected";
        server.session = 42;
        equals(server.loggedIn(), true);
        server.registerUpdate(function(server, packet) {
                equals(server.loggedIn(), false);
                equals(server.logname, null, "logname");
                equals(packet.type, "PacketLogout");
                equals(server.session, 'clear', "does not have session");
                start();
            });
        server.logout();
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
        equals(self.state, 'disconnected');
        self.ping();
        var ping_count = 0;
        self.registerUpdate(function(server, data) {
                equals(server.state, 'connected');
                if(++ping_count >= 2) {
                    server.reset();
                    start();
                } else {
                    server.state = 'disconnected';
                }
                return true;
            });
    });

test("jpoker.connection:sendPacket error 404", function(){
        expect(1);
        stop();
        var self = new jpoker.connection();
        
        error = jpoker.error;
        jpoker.error = function(reason) {
            jpoker.error = error;
            equals(reason.xhr.status, 404);
            start();
        };
        ActiveXObject.defaults.status = 404;
        self.sendPacket({type: 'type'});
        ActiveXObject.defaults.status = 200;
    });

test("jpoker.connection:sendPacket error 500", function(){
        expect(1);
        stop();
        var self = new jpoker.connection();
        
        error = jpoker.error;
        jpoker.error = function(reason) {
            jpoker.error = error;
            equals(reason.xhr.status, 500);
            start();
        };
        ActiveXObject.defaults.status = 500;
        self.sendPacket({type: 'type'});
        ActiveXObject.defaults.status = 200;
    });

test("jpoker.connection:sendPacket timeout", function(){
        expect(1);
        stop();
        var self = new jpoker.connection({
                timeout: 1
            });
        
        self.reset = function() {
            equals(this.state, 'disconnected');
            start();
        };
        self.state = 'connected';
        ActiveXObject.defaults.timeout = true;
        self.sendPacket({type: 'type'});
        ActiveXObject.defaults.timeout = false;
    });

test("jpoker.connection:sendPacket ", function(){
        expect(5);
        var self = new jpoker.connection({
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

        ActiveXObject.prototype.server = new PokerServer();

        var clock = 1;
        jpoker.now = function() { return clock++; };
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
        var self = new jpoker.connection();

        var cleared = false;
        self.clearTimeout = function(id) { cleared = true; };
        self.setTimeout = function(cb, delay) { throw "setTimeout"; };
        
        self.dequeueIncoming();

        ok(cleared, "cleared");
    });

test("jpoker.connection:dequeueIncoming setTimeout", function(){
        expect(2);
        var self = new jpoker.connection();

        var clock = 1;
        jpoker.now = function() { return clock++; };
        var timercalled = false;
        self.clearTimeout = function(id) { };
        self.setTimeout = function(cb, delay) { timercalled = true; };

        // will not be deleted to preserve the delay
        self.queues[0] = { 'high': {'packets': [],
                                    'delay':  500 },
                           'low': {'packets': [],
                                   'delay': 0 } };
        // will be deleted because it is empty
        self.queues[1] = { 'high': {'packets': [],
                                    'delay':  0 },
                           'low': {'packets': [],
                                   'delay': 0 } };
        self.dequeueIncoming();

        ok(!(1 in self.queues));
        ok(timercalled);
    });

test("jpoker.connection:dequeueIncoming handle", function(){
        expect(6);
        var self = new jpoker.connection();

        self.clearTimeout = function(id) { };

        var packet = { type: 'type1', time__: 1 };
        self.queues[0] = { 'high': {'packets': [],
                                    'delay':  0 },
                           'low': {'packets': [packet],
                                   'delay': 0 } };
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
        var self = new jpoker.connection();

        var packet = { type: 'type1', time__: 1 };
        self.queues[0] = { 'high': {'packets': [],
                                    'delay':  0 },
                           'low': {'packets': [packet],
                                   'delay': 0 } };
        var handler = function(com, id, packet) {
            throw "the error";
        };
        self.error = function(reason) {
            equals(reason, "the error");
            start();
        };
        self.registerHandler(0, handler);
        self.dequeueIncoming();
    });

test("jpoker.connection:dequeueIncoming delayed", function(){
        expect(6);
        var self = new jpoker.connection();

        var clock = 1;
        jpoker.now = function() { return clock++; };
        self.clearTimeout = function(id) { };

        var packet = { type: 'type1', time__: 1 };
        var delay = 10;
        self.delayQueue(0, delay);
        equals(self.delays[0], delay);
        self.queues[0] = { 'high': {'packets': [],
                                    'delay':  0 },
                           'low': {'packets': [packet],
                                   'delay': 0 } };
        self.dequeueIncoming();
        equals(self.queues[0].low.packets[0], packet);
        equals(self.queues[0].low.delay, delay);

        var message = false;
        var message_function = jpoker.message;
        jpoker.message = function(str) { message = true; };
        self.dequeueIncoming();
        equals(self.queues[0].low.delay, delay);
        equals(message, true, "message");
        jpoker.message = message_function;

        self.noDelayQueue(0);
        equals(self.delays[0], undefined, "delays[0]");

        self.queues = {};
    });

test("jpoker.connection:dequeueIncoming lagmax", function(){
        expect(4);
        var self = new jpoker.connection();

        var clock = 10;
        jpoker.now = function() { return clock++; };
        self.lagmax = 5;
        self.clearTimeout = function(id) { };

        var packet = { type: 'type1', time__: 1 };
        self.queues[0] = { 'high': {'packets': [],
                                    'delay':  0 },
                           'low': {'packets': [packet],
                                   'delay': 50 } };
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
        var self = new jpoker.connection();

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

//
// jpoker.table
//
test("jpoker.table.init", function(){
        expect(4);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var game_id = 100;

        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: '[{"type": "PacketPokerTable", "id": ' + game_id + '}]',

            handle: function(packet) {
                equals(packet, '{"type":"PacketPokerTableJoin","game_id":' + game_id + '}');
            }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var handler = function(server, packet) {
            if(packet.type == "PacketPokerTable") {
                equals(packet.id, game_id);
                equals(game_id in server.tables, true, game_id + " created");
                equals(server.tables[game_id].id, game_id, "id")
                delete ActiveXObject.prototype.server;
                start();
            }
            return true;
        };
        server.registerUpdate(handler);
        server.tableJoin(game_id);
    });


test("jpoker.table.uninit", function(){
        expect(1);

        var server = jpoker.serverCreate({ url: 'url' });
        var game_id = 100;
        var table = new jpoker.table(server, { type: "PacketPokerTableJoin",
                                               game_id: game_id });
        server.tables[game_id] = table;
        var handler = function() {
            equals(game_id in server.tables, false, 'table removed from server');
        };
        table.registerDestroy(handler);
        table.handler(server, game_id, { type: 'PacketPokerTableDestroy', game_id: game_id });
    });

//
// tableList
//
var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": [{"observers": 1, "name": "One", "percent_flop" : 98, "average_pot": 1535, "seats": 10, "variant": "holdem", "hands_per_hour": 220, "betting_structure": "2-4-limit", "currency_serial": 1, "muck_timeout": 5, "players": 4, "waiting": 0, "skin": "default", "id": 100, "type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Two", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 101,"type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Three", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-pot-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 102,"type": "PacketPokerTable", "player_timeout": 60}]};

test("jpoker.plugins.tableList", function(){
        expect(7);
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

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.state = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
        equals(server.callbacks.update.length, 0, 'no update registered');
        place.jpoker('tableList', 'url', { delay: 30 });
        equals(server.callbacks.update.length, 1, 'tableList update registered');
        server.registerUpdate(function(server, data) {
                var element = $("#" + id);
                if(element.length > 0) {
                    var tr = $("#" + id + " tr", place);
                    equals(tr.length, 4);
                    $("#" + id).remove();
                    return true;
                } else {
                    equals(server.callbacks.update.length, 2, 'tableList and test update registered');
                    equals('tableList' in server.timers, true, 'timer active');
                    server.setTimeout = function(fun, delay) { };
                    window.setTimeout(function() {
                            jpoker.serverDestroy('url');
                            delete ActiveXObject.prototype.server;
                            start();
                        }, 30);
                    return false;
                }
            });
        server.registerDestroy(function(server) {
                equals('tableList' in server.timers, false, 'timer killed');
                equals(server.callbacks.update.length, 0, 'update & destroy unregistered');
            });
    });

//
// serverStatus
//
test("jpoker.plugins.serverStatus", function(){
	expect(6);

        var server = jpoker.serverCreate({ url: 'url' });

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");

        //
        // disconnected
        //
	place.jpoker('serverStatus', 'url');
	var content = $("#" + id).text();
	equals(content.indexOf("disconnected") >= 0, true, "disconnected");

        //
        // connected
        //
        if(jpoker.plugins.serverStatus.templates.connected === '') {
            jpoker.plugins.serverStatus.templates.connected = 'connected';
        }
        server.playersCount = 12;
        server.tablesCount = 23;
        server.state = 'connected';
        server.notifyUpdate();
        content = $("#" + id).text();

	equals(content.indexOf("connected") >= 0, true, "connected");
	equals(content.indexOf("12") >= 0, true, "12 players");
	equals(content.indexOf("23") >= 0, true, "23 players");
        //
        // element destroyed
        //
        $("#" + id).remove();
        equals(server.callbacks.update.length, 1, "1 update callback");
        server.notifyUpdate();
        equals(server.callbacks.update.length, 0, "0 update callback");
    });

//
// login
//
$.fn.triggerKeypress = function(keyCode) {
    return this.trigger("keypress", [$.event.fix({event:"keypress", keyCode: keyCode, target: this[0]})]);
};

test("jpoker.plugins.login", function(){
        expect(8);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

	place.jpoker('login', 'url');
        var content = null;
        
	content = $("#" + id).text();
	equals(content.indexOf("login:") >= 0, true, "login:");

        var expected = { name: 'logname', password: 'password' };
        $("#name", place).attr('value', expected.name);
        $("#password", place).attr('value', expected.password);
        var result = { name: null, password: null };
        server.login = function(name, password) {
            result.name = name;
            result.password = password;
        };
        $("#login", place).triggerKeypress("13");
	content = $("#" + id).text();
        equals(content.indexOf("login in progress") >=0, true, "login keypress");
        equals(result.name, expected.name, "login name");
        equals(result.password, expected.password, "login password");

        server.serial = 1;
        server.logname = 'logname';
        server.notifyUpdate();
	content = $("#" + id).text();
	equals(content.indexOf("logname logout") >= 0, true, "logout");
        equals(server.loggedIn(), true, "loggedIn");

        $("#logout", place).click();
        equals(server.loggedIn(), false, "logged out");
	content = $("#" + id).text();
	equals(content.indexOf("login:") >= 0, true, "login:");

        $("#" + id).remove();
    });

//
// table
//
test("jpoker.plugins.table", function(){
        expect(4);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

        var game_id = 100;

        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: '[{"type": "PacketPokerTable", "id": ' + game_id + '}]',

            handle: function(packet) {
                equals(packet, '{"type":"PacketPokerTableJoin","game_id":' + game_id + '}');
            }
        };

        ActiveXObject.prototype.server = new PokerServer();

        place.jpoker('table', 'url', { id: game_id });
        var handler = function(server, packet) {
            if(packet.type == 'PacketPokerTable') {
                content = $("#" + id).text();
                equals(content.indexOf("CsCsCs") >= 0, true, "board");
                equals($("#P01" + id).text(), "P01");
                $("#" + id).remove();
                delete ActiveXObject.prototype.server;
                start();
                return false;
            } else {
                return true;
            }
        };
        server.registerUpdate(handler);
	content = $("#" + id).text();
	equals(content.indexOf("connecting to table " + game_id) >= 0, true, "connecting");
    });

test("profileEnd", function(){
        try {
            console.profileEnd();
        } catch(e) {}
    });

