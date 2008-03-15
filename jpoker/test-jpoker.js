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
module("jpoker");

var jpoker = $.fn.jpoker;

test("jpoker: unique id generation test", function() {
        expect(10);
        var i = 0;
        for (var j =0; j<10; j++)
                equals(jpoker.uid(),j);
    });

var XMLHttpRequest = function() {};

XMLHttpRequest.prototype = {
    headers: [],

    server: null,

    readyState: 4,

    status: 200,

    responseText: "",

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

    send: function(data) {
        this.server.handle(data);
        this.responseText = this.server.outgoing; 
    }
};

var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": [{"observers": 1, "name": "One", "percent_flop" : 98, "average_pot": 1535, "seats": 10, "variant": "holdem", "hands_per_hour": 220, "betting_structure": "2-4-limit", "currency_serial": 1, "muck_timeout": 5, "players": 4, "waiting": 0, "skin": "default", "id": 100, "type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Two", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 101,"type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Three", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-pot-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 102,"type": "PacketPokerTable", "player_timeout": 60}]};

test("jpoker.TableList: new", function(){
        expect(3);
        var tableList = jpoker.TableList;

        tableList.prototype.clearTimeout = function(id) { };
        tableList.prototype.setTimeout = function(cb, delay) { };

        var place = $("#main");

        var t = new tableList(place, null, 'testtableid');

        var element = $("#" + t.id, place);
        equals(t.id, 'testtableid');
        equals(element.length, 1);
        equals(typeof jpoker.com.handlers[0][0], 'function');

        element.remove();

        jpoker.com.handlers = {};
    });

test("jpoker.TableList: refresh", function(){
        expect(4);
        com = jpoker.com;

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

        com.request.async = false;
        delete com.request.mode;

        com.clearTimeout = function(id) { };
        com.setTimeout = function(cb, delay) {};

        var tableList = jpoker.TableList;

        tableList.prototype.clearTimeout = function(id) { };
        tableList.prototype.setTimeout = function(cb, delay) { };

        var id = 'testtableid';
        var place = $("#main");
        var t = new tableList(place, null, id);
        t.refresh(id);
        // the answer from the PokerServer is waiting in the incoming queue
        equals(com.queues[0].low.packets.length, 1);
        equals(com.queues[0].low.packets[0].type, TABLE_LIST_PACKET['type']);
        com.dequeueIncoming(com);

        var tr = $("#" + id + " tr", place);
        equals(t.id, id);
        equals(tr.length, 4);

        $("#" + id, place).remove();
        jpoker.com.handlers = {};
    });

test("jpoker.TableList: populateTable", function(){
        expect(3);
        var tableList = jpoker.TableList;

        var timerId = 42;
        tableList.prototype.clearTimeout = function(id) { };
        tableList.prototype.setTimeout = function(cb, delay) { return timerId; };

	var packet = TABLE_LIST_PACKET;

        var id = 'testtableid';
        var place = $("#main");
        var t = new tableList(place, null, id);
        t.populateTable(id, packet);

        var tr = $("#" + id + " tr", place);
        equals(t.id, id);
        equals(tr.length, 4);
        equals(tableList.prototype.timerId, timerId);

        $("#" + id, place).remove();
        jpoker.com.handlers = {};
    });

test("jpoker.com:sendPacket", function(){
        expect(3);
        self = jpoker.com;

        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: '',

            handle: function(packet) {
                this.outgoing = "[ " + packet + " ]";
            }
        };

        XMLHttpRequest.prototype.server = new PokerServer();

        var clock = 1;
        self.now = function() { return clock++; }
        self.clearTimeout = function(id) { };
        self.setTimeout = function(cb, delay) {
            if(delay == self.pingFrequency)
                return;
            return cb();
        };

        self.request.async = false;
        delete self.request.mode;

        var handled;
        var handler = function(com, id, packet) {
            handled = [ com, id, packet ];
        };
        self.registerHandler(0, handler);

        var type = 'type1';
        var packet = {type: type};

        self.sendPacket(packet);

        self.unregisterHandler(0, handler);

        equals(handled[0], self);
        equals(handled[1], 0);
        equals(handled[2].type, type);
    });

test("jpoker.com:dequeueIncoming clearTimeout", function(){
        expect(1);
        self = jpoker.com;

        var cleared = false;
        self.clearTimeout = function(id) { cleared = true; };
        self.setTimeout = function(cb, delay) { throw "setTimeout"; };
        
        self.dequeueIncoming();

        ok(cleared);
    });

test("jpoker.com:dequeueIncoming setTimeout", function(){
        expect(2);
        self = jpoker.com;

        var clock = 1;
        self.now = function() { return clock++; }
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

test("jpoker.com:dequeueIncoming handle", function(){
        expect(6);
        self = jpoker.com;

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

        ok(!("time__" in packet));
    });

test("jpoker.com:dequeueIncoming delayed", function(){
        expect(6);
        self = jpoker.com;

        var clock = 1;
        self.now = function() { return clock++; }
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
        self.verbose = 1;
        self.message = function(str) { message = true; }
        self.dequeueIncoming();
        equals(self.queues[0].low.delay, delay);
        ok(message, "message");

        self.noDelayQueue(0);
        equals(self.delays[0], undefined);

        self.queues = {};
    });

test("jpoker.com:dequeueIncoming lagmax", function(){
        expect(4);
        self = jpoker.com;

        var clock = 10;
        self.now = function() { return clock++; }
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

test("jpoker.com:queueIncoming", function(){
        expect(4);
        self = jpoker.com;

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
    });
