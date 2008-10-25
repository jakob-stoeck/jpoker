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

var cleanup = function(id) {
    if(id) {
        $("#" + id).remove();
    }
    if('server' in ActiveXObject.prototype) {
        delete ActiveXObject.prototype.server;
    }
    var callbacks_left = [];
    $.each(jpoker.servers,
	   function(key, server) {
	       $.each(server.callbacks, function(key, callbacks) {
		       callbacks_left.push([key, callbacks]);
		       if (key == 'update') {
			   if (callbacks.length !== 0) {
			       ok(false, 'update callback should be cleared before cleanup: {count} callbacks left'.supplant({count:callbacks.length}));
			   }
		       }
		   });
	   });
    jpoker.uninit();
    $.cookie('jpoker_preferences_'+jpoker.url2hash('url'), null);
    $.cookie('jpoker_count_'+jpoker.url2hash('url'), null);
    $.cookie('jpoker_count_'+jpoker.url2hash('url2'), null);
    $('#jpokerDialog').dialog('close').remove();
    $('#jpokerRebuy').dialog('close').remove();
};

var start_and_cleanup = function(id) {
    setTimeout(function() {
            cleanup(id);
            start();
        }, 1);
};

test("String.supplant", function() {
        expect(1);
        equals("{a}".supplant({'a': 'b'}), 'b');
    });

var jpoker = $.jpoker;

jpoker.verbose = 1; // activate the code parts that depends on verbosity
jpoker.sound = 'span'; // using embed for test purposes triggers too many problems

//
// jpoker
//

test("jpoker: get{Server,Table,Player}", function() {
        expect(15);
        // getServer
        equals(jpoker.getServer('url'), undefined, 'get non existent server');
        jpoker.servers.url = 'yes';
        equals(jpoker.getServer('url'), 'yes', 'get  existing server');
        // getTable
        jpoker.servers.url = { tables: {} };
        equals(jpoker.getTable('no url', 'game_id'), undefined, 'getTable non existing server');
        equals(jpoker.getTable('url', 'game_id'), undefined, 'getTable non existing table');
        jpoker.servers.url = { tables: { 'game_id': 'yes' } };
        equals(jpoker.getTable('url', 'game_id'), 'yes', 'getTable existing table');
        // getPlayer
        equals(jpoker.getPlayer('no url', 'game_id'), undefined, 'getPlayer non existing server');
        equals(jpoker.getPlayer('url', 'no game_id'), undefined, 'getPlayer non existing table');
        jpoker.servers.url = { tables: { 'game_id': { 'serial2player': { } } } };
        equals(jpoker.getPlayer('url', 'game_id', 'player_id'), undefined, 'getPlayer non existing player');
        jpoker.servers.url = { tables: { 'game_id': { 'serial2player': { 'player_id': 'player' } } } };
        equals(jpoker.getPlayer('url', 'game_id', 'player_id'), 'player', 'getPlayer non existing player');
        // getServerTablePlayer
        equals(jpoker.getServerTablePlayer('no url', 'game_id'), undefined, 'getServerTablePlayer non existing server');
        equals(jpoker.getServerTablePlayer('url', 'no game_id'), undefined, 'getServerTablePlayer existing table');
        jpoker.servers.url = { tables: { 'game_id': { 'serial2player': { } } } };
        equals(jpoker.getServerTablePlayer('url', 'game_id', 'player_id'), undefined, 'getServerTablePlayer non existing player');
        jpoker.servers.url = { tables: { 'game_id': { 'serial2player': { 'player_id': 'player' } } } };
        var result = jpoker.getServerTablePlayer('url', 'game_id', 'player_id');
        equals('tables' in result.server, true, 'server has table');
        equals('serial2player' in result.table, true, 'table has players');
        equals(result.player, 'player', 'player is known');
        jpoker.servers = {};
    });

test("jpoker.alert", function() {
    expect(1);
    var windowAlert = window.alert;
    window.alert = function(message) {
	equals(message, 'foo', 'alert called');
    };
    jpoker.alert('foo');
    window.alert = windowAlert;
});

//
// jpoker.error
//
test("jpoker.error", function() {
        expect(3);
	var error_reason = "error reason";
	var jpokerMessage = jpoker.message;
	var jpokerAlert = jpoker.alert;
	var jpokerConsole = jpoker.console;
	jpoker.console = function(reason) {
	};
	jpoker.message = function(reason) {
	    equals(error_reason, reason, "jpoker.message error_reason message");
	};
	jpoker.alert = function(reason) {
	    ok(false, 'alert not called');
	};
	jpokerUninit = jpoker.uninit;
	jpoker.uninit = function() {
	    ok (true, "uninit called");
	};
	try {
	    jpoker.error(error_reason);
	} catch (reason) {
	    equals(reason, error_reason, "error_reason thrown");
	}
	jpoker.message = jpokerMessage;
	jpoker.alert = jpokerAlert;
	jpoker.console = jpokerConsole;
	jpoker.uninit = jpokerUninit;
});

test("jpoker.error alert", function() {
        expect(2);
	var error_reason = "error reason";
	var jpokerConsole = jpoker.console;
	jpoker.console = undefined;
	var jpokerAlert = jpoker.alert;
	jpoker.alert = function(reason) {
	    jpoker.alert = jpokerAlert;
	    equals(error_reason, reason, "jpoker.alert error_reason message");
	};
	try {
	    jpoker.error(error_reason);
	} catch (reason) {
	    equals(reason, error_reason, "error_reason thrown");
	}
	jpoker.console = jpokerConsole;
});

//
// jpoker.watchable
//
test("jpoker.watchable", function(){
        expect(22);
        var watchable = new jpoker.watchable({});
        var stone = 0;
        var callback_stone = 0;
        var callback = function(o, what, data, callback_data) {
            stone += data;
            callback_stone += callback_data;
            return true;
        };
        watchable.registerUpdate(callback, 100);
        watchable.registerDestroy(callback, 100);
        watchable.notifyUpdate(1);
        equals(stone, 1, "notifyUpdate");
        equals(callback_stone, 100, "notifyUpdate callback_data");
        watchable.notifyDestroy(1);
        equals(stone, 2, "notifyDestroy");
        equals(callback_stone, 200, "notifyDestroy callback_data");
        watchable.unregisterUpdate(callback);
        watchable.unregisterDestroy(callback);
        watchable.notifyUpdate(10);
        equals(stone, 2, "notifyUpdate (noop)");
        equals(callback_stone, 200, "notifyUpdate callback_data");
        watchable.notifyDestroy(20);
        equals(stone, 2, "notifyDestroy (noop)");
        equals(callback_stone, 200, "notifyDestroy callback_data");

        var callback_autoremove = function() {
            return false;
        };
        watchable.registerUpdate(callback_autoremove);
        watchable.notifyUpdate();
        equals(watchable.callbacks.update.length, 0, 'empty update');

        watchable.registerDestroy(callback_autoremove);
        watchable.notifyDestroy();
        equals(watchable.callbacks.destroy.length, 0, 'empty destroy');

        watchable.registerUpdate(callback_autoremove, 'callback_data', 'signature');
        equals(watchable.callbacks.update[0].signature, 'signature', 'signature update');
        watchable.unregisterUpdate('signature');
        equals('update' in watchable.callbacks, false, 'empty update (2)');

        watchable.registerDestroy(callback_autoremove, 'callback_data', 'signature');
        equals(watchable.callbacks.destroy[0].signature, 'signature', 'signature destroy');
        watchable.unregisterDestroy('signature');
        equals('destroy' in watchable.callbacks, false, 'empty destroy (2)');

        watchable = new jpoker.watchable({});
        var recurse = function() {
            caught = false;
            try {
                watchable.notifyUpdate(null);
            } catch(error) {
                caught = true;
                equals(error.indexOf('notify recursion') >= 0, true, 'recurse error');
            }
            equals(caught, true, 'caught');
        };
        watchable.registerUpdate(recurse);
        watchable.notifyUpdate();
        watchable.unregisterUpdate(recurse);
        var verified = false;
        var verify = function() {
            verified = true;
        };
        var notifyregister = function() {
            watchable.registerUpdate(verify);
        };
        watchable.registerUpdate(notifyregister);
        watchable.notifyUpdate(); // register
        watchable.notifyUpdate(); // call it
        equals(verified, true, 'verified');
        watchable.unregisterUpdate(notifyregister);
        watchable.notifyUpdate();

        watchable = new jpoker.watchable({});
        reinit_done = false;
        var notifyreinit = function(self, what, data) {
            equals(what, 'reinit');
            equals(data, 'data');
            reinit_done = true;
            return true;
        };
        watchable.registerReinit(notifyreinit, 'reinit');
        watchable.notifyReinit('data');
        equals(reinit_done, true, 'reinit done');
        equals(watchable.callbacks.reinit.length, 1, 'reinit in callbacks');
        watchable.unregisterReinit('reinit');
        equals('reinit' in watchable.callbacks, true, 'reinit has no callbacks');
    });

//
// jpoker.chips
//
test("jpoker.chips: LONG", function() {
        expect(5);
        equals(jpoker.chips.LONG(10.101), '10.1');
        equals(jpoker.chips.LONG(10.111), '10.11');
        equals(jpoker.chips.LONG(10.001), '10');
        equals(jpoker.chips.LONG(0.101), '0.1');
        equals(jpoker.chips.LONG(0.011), '0.01');
    });

test("jpoker.chips: SHORT", function() {
        expect(16);
        equals(jpoker.chips.SHORT(123456789012.34), '123G');
        equals(jpoker.chips.SHORT(12345678901.23), '12G');
        equals(jpoker.chips.SHORT(1234567890.12), '1.2G');
        equals(jpoker.chips.SHORT(123456789.01), '123M');
        equals(jpoker.chips.SHORT(12345678.90), '12M');
        equals(jpoker.chips.SHORT(1234567.89), '1.2M');
        equals(jpoker.chips.SHORT(123456.78), '123K');
        equals(jpoker.chips.SHORT(12345.67), '12K');
        equals(jpoker.chips.SHORT(1234.56), '1.2K');
        equals(jpoker.chips.SHORT(123.45), '123');
        equals(jpoker.chips.SHORT(10.10), '10');
        equals(jpoker.chips.SHORT(10.11), '10');
        equals(jpoker.chips.SHORT(10.00), '10');
        equals(jpoker.chips.SHORT(1.11), '1.11');
        equals(jpoker.chips.SHORT(0.11), '0.11');
        equals(jpoker.chips.SHORT(0.01), '0.01');
    });

test("jpoker.chips: chips2value", function() {
        expect(4);
        equals(jpoker.chips.chips2value([ 1, 2 ] ) - 0.02 < jpoker.chips.epsilon, true, "0.02");
        equals(jpoker.chips.chips2value([ 1, 2, 10, 3 ] ) - 0.32 < jpoker.chips.epsilon, true, "0.32");
        equals(jpoker.chips.chips2value([ 1, 2, 10, 3, 100, 5 ] ) - 5.32 < jpoker.chips.epsilon, true, "5.32");
        equals(jpoker.chips.chips2value([ 10000, 5 ] ) - 500 < jpoker.chips.epsilon, true, "500");
    });

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

test("jpoker.url2server", function(){
        expect(1);
	jpoker.servers = {};
	var options = {url : 'url'};
	var server = jpoker.url2server(options);
	equals(server.url, options.url, "server created");
    });

test("jpoker.dialog", function(){
        expect(2);
        var message = 'ZAAAZ';
        jpoker.dialog(message);
        equals($('#jpokerDialog').text().indexOf(message) >= 0, true, message);
        equals($('.ui-dialog-container').css('width'), '100%', 'containerWidth 100%');
        cleanup();
    });

test("jpoker.dialog options title", function(){
        expect(3);
        var message = 'ZAAAZ';
	var jpokerDialogOptions = jpoker.dialog_options;
	jpokerDialogOptions.title = 'foo';
        jpoker.dialog(message);
        equals($('#jpokerDialog').text().indexOf(message) >= 0, true, message);
        equals($('.ui-dialog-container').css('width'), '100%', 'containerWidth 100%');
	equals($('#jpokerDialog').attr('title'), 'foo', 'dialog title');
	jpoker.dialog_options = jpokerDialogOptions;
        cleanup();
    });

test("jpoker.dialog options title undefined", function(){
        expect(3);
        var message = 'ZAAAZ';
	var jpokerDialogOptions = jpoker.dialog_options;
	jpokerDialogOptions.title = undefined;
        jpoker.dialog(message);
        equals($('#jpokerDialog').text().indexOf(message) >= 0, true, message);
        equals($('.ui-dialog-container').css('width'), '100%', 'containerWidth 100%');
	equals($('#jpokerDialog[title]').length, 0, 'no dialog title');
	jpoker.dialog_options = jpokerDialogOptions;
        cleanup();
    });

test("jpoker.dialog msie", function(){
        expect(2);
        jpoker.msie_compatibility();
        var message = 'ZAAAZ';
        jpoker.dialog(message);
        equals($('#jpokerDialog').text().indexOf(message) >= 0, true, message);
        equals($('.ui-dialog-container').css('width'), '300px', 'containerWidth');
        $('#jpokerDialog').dialog('close');
        jpoker.other_compatibility();
        cleanup();
    });

test("jpoker.copyright", function(){
        expect(1);
        var copyright = jpoker.copyright();
        equals(copyright.text().indexOf('GNU') >= 0, true, 'GNU');
        copyright.dialog('destroy');
        cleanup();
    });

test("jpoker.copyright msie", function(){
        expect(2);
        jpoker.msie_compatibility();
        var copyright = jpoker.copyright();
        equals(copyright.text().indexOf('GNU') >= 0, true, 'GNU');
        equals($('.ui-dialog-container').css('width'), '400px', 'containerWidth');
        copyright.dialog('destroy');
        jpoker.other_compatibility();
        cleanup();
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
        var timerRequest = {timer:0};
        var handler = function(server, packet) {
            equals(packet.type, 'packet');
            equals(timerRequest.timer !== 0, true, 'timer');
            window.clearInterval(timerRequest.timer);
            start_and_cleanup();
            return false;
        };
	jpoker.verbose = 1;
        timerRequest = jpoker.refresh(server, request, handler, 'state');
    });

test("jpoker.refresh waiting", function(){
        expect(1);

        var server = jpoker.serverCreate({ url: 'url' });
	server.setInterval = function(id) {};
        var timerRequest = jpoker.refresh(server, function() {}, function() {}, 'state');
	jpoker.verbose = 1;
	var jpokerMessage = jpoker.message;
	jpoker.message = function(message) {
	    jpoker.message = jpokerMessage;
	    equals(message, 'refresh waiting', 'refresh waiting');
	};
	timerRequest.request();
    });

test("jpoker.refresh requireSession", function(){
        expect(1);

        var server = jpoker.serverCreate({ url: 'url' });

        equals(jpoker.refresh(server, null, null, 'state', { requireSession: true }).timer, 0, 'requireSession');

        cleanup();
    });

//
// jpoker.Crypto
//
test("jpoker.Crypto b32 str", function (){
	expect(1);
	equals(jpoker.Crypto.be32sToStr(jpoker.Crypto.strToBe32s("0123")), "0123", "str to be32 to str");
    });

//
// jpoker.server
//

test("jpoker.server.uninit", function() {
	expect(4);
        var server = jpoker.serverCreate({ url: 'url' });
	var game_id = 42;
        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
	var tourney_serial = 43;
        server.tourneys[game_id] = new jpoker.tourney(server, tourney_serial);

	server.tables[game_id].uninit = function() {
	    ok(true, "table uninit called");	    
	};
	server.tourneys[game_id].uninit = function() {
	    ok(true, "tourney uninit called");
	};
	server.uninit();
	var table_count = 0;
	for (var table in server.tables) { ++table_count; }
	var tourney_count = 0;
	for (var tourneys_count in server.tourneys) { ++tourney_count; }
	equals(table_count, 0, "server.tables empty");
	equals(tourney_count, 0, "server.tourneys empty");
    });

test("jpoker.server.handler PacketPokerMessage/GameMessage ", function(){
        expect(2);
	
        var server = jpoker.serverCreate({ url: 'url' });
        var message = "AAA";
        server.handler(server, 0, { type: 'PacketPokerMessage', string: message });
        dialog = $("#jpokerDialog");
        equals(dialog.text().indexOf(message) >= 0, true, 'found (1)');
        message = "BBB";
        server.handler(server, 0, { type: 'PacketPokerGameMessage', string: message });
        equals(dialog.text().indexOf(message) >= 0, true, 'found (2)');
        dialog.dialog('destroy');
        cleanup();
    });

test("jpoker.server.{de,}queueRunning", function(){
        expect(5);
        var server = jpoker.serverCreate({ url: 'url'});
        var called = 2;
        var callback = function(server) {
            called--;
        };
        server.setState('dummy');
        server.queueRunning(function(server) { callback(); server.setState('dummy'); });
        server.queueRunning(callback);
        server.setState(server.RUNNING);
        equals(called, 1, 'callback called');
        equals(server.stateQueue.length, 1, 'one callback to go');
        equals(server.state, 'dummy', 'callback changed state');
        server.setState(server.RUNNING);
        equals(called, 0, 'callback called twice');
        equals(server.stateQueue.length, 0, 'no more callbacks');
        cleanup();
    });

test("jpoker.server.init reconnect", function(){
        expect(2);
        var server = jpoker.serverCreate({ url: 'url',
                                           cookie: function() { return this.sessionName(); } });

        equals(server.state, server.RECONNECT);
        equals(server.session.indexOf('clear') >= 0, false, 'session set');
        cleanup();
    });

test("jpoker.server.init reconnect file: protocol", function(){
        expect(2);
        var server = jpoker.serverCreate({ url: 'url',
                                           protocol: function() { return 'file:'; } });

        equals(server.state, server.RECONNECT);
        equals(server.session.indexOf('clear') >= 0, false, 'session set');
        cleanup();
    });

test("jpoker.server.reconnect success", function(){
        expect(5);
        stop();

        var player_serial = 43;
        var PokerServer = function() {};
        PokerServer.prototype = {
            outgoing: '[{"type": "PacketPokerPlayerInfo", "serial": ' + player_serial + '}]',

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });

        var expected = server.RECONNECT;
        server.registerUpdate(function(server, what, packet) {
                if(packet.type == 'PacketState') {
                    equals(server.state, expected);
                    if(expected == server.RECONNECT) {
                        expected = server.MY;
                    } else if(expected == server.MY) {
                        equals(server.serial, player_serial, 'player_serial');
                        equals(server.session.indexOf('clear') >= 0, false, 'session is set');
                        start_and_cleanup();
			return false;
                    }
                }
                return true;
            });

        server.reconnect();
        equals(server.session.indexOf('clear') >= 0, false, 'session is set');
    });

test("jpoker.server.reconnect failure", function(){
        expect(2);
        stop();

        var PokerServer = function() {};
        PokerServer.prototype = {
            outgoing: '[{"type": "PacketError", "code": ' + jpoker.packetName2Type.POKER_GET_PLAYER_INFO + '}]',

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });

        var expected = server.RECONNECT;
        server.registerUpdate(function(server, what, packet) {
                if(packet.type == 'PacketState') {
                    equals(server.state, expected);
                    if(expected == server.RECONNECT) {
                        expected = server.RUNNING;
                        start_and_cleanup();
			return false;
                    }
                }
                return true;
            });

        server.reconnect();
        equals(server.session.indexOf('clear') >= 0, false, 'session is set');
    });

test("jpoker.server.reconnect invalid error", function(){
        expect(1);
        stop();

        var code = 444;
        var PokerServer = function() {};
        PokerServer.prototype = {
            outgoing: '[{"type": "PacketError", "code": ' + code + '}]',

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });

        var error = jpoker.error;
        jpoker.error = function(message) {
            jpoker.error = error;
            equals(message.indexOf(code) >= 0, true, 'invalid error code');
            start_and_cleanup();
        };
        server.reconnect();
    });

test("jpoker.server.reconnect waiting", function(){
        expect(2);
	
        var server = jpoker.serverCreate({ url: 'url' });
	server.callbacks[0] = [];
	server.reconnect();
	equals(server.callbacks[0].length, 1, 'reconnect callback registered');
	var callback = server.callbacks[0][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'reconnect callback still in place');
    });

test("jpoker.server.refreshTable waiting", function(){
        expect(2);
	
        var server = jpoker.serverCreate({ url: 'url' });
	server.callbacks[0] = [];
	server.refreshTables('');
	equals(server.callbacks[0].length, 1, 'refreshTables callback registered');
	var callback = server.callbacks[0][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'refreshTables callback still in place');
    });

test("jpoker.server.refreshTourneys waiting", function(){
        expect(2);
	
        var server = jpoker.serverCreate({ url: 'url' });
	server.callbacks[0] = [];
	server.refreshTourneys('');
	equals(server.callbacks[0].length, 1, 'refreshTourneys callback registered');
	var callback = server.callbacks[0][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'refreshTourneys callback still in place');
    });

test("jpoker.server.refreshTourneyDetails waiting", function(){
        expect(2);
	
        var server = jpoker.serverCreate({ url: 'url' });
	server.callbacks[0] = [];
	server.refreshTourneyDetails(0);
	equals(server.callbacks[0].length, 1, 'refreshTourneyDetails callback registered');
	var callback = server.callbacks[0][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'refreshTourneyDetails callback still in place');
    });

test("jpoker.server.rejoin", function(){
        expect(5);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;
	var tourney_serial = 200;

        var PokerServer = function() {};
        PokerServer.prototype = {
            outgoing: '[{"type": "PacketPokerPlayerPlaces", "tables": [' + game_id + '], "tourneys": [' + tourney_serial + ']}]',

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();
        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);

        server.tourneys[tourney_serial] = new jpoker.tourney(server, tourney_serial);
        var tourney = server.tourneys[tourney_serial];

        var player_serial = 43;
        var player_seat = 2;
        var player_name = 'username';
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', name: player_name, seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];

        server.handler(server, 0, { type: 'PacketSerial', serial: player_serial});

        var destroyed = false;
        table.registerUpdate(function(table, what, packet) {
                if(packet.type == 'PacketPokerTableDestroy') {
                    destroyed = true;
                    return false;
                }
                return true;
            });
        var expected = server.MY;
        server.registerUpdate(function(server, what, packet) {
                if(packet.type == 'PacketState') {
                    equals(server.state, expected);
                    if(expected == server.MY) {
                        expected = server.RUNNING;
                    } else if(expected == server.RUNNING) {
                        start_and_cleanup();
			return false;
                    }
                }
                return true;
            });
        server.tableJoin = function(other_game_id) {
            equals(other_game_id, game_id, 'rejoin same table');
        };
        server.tourneyJoin = function(game_id) {
            equals(game_id, tourney_serial, 'rejoin same tourney');
        };

        server.getUserInfo = function() {
            equals(true, true, 'getUserInfo called');
        };

        server.rejoin();
    });

test("jpoker.server.rejoin waiting", function(){
        expect(2);
	
        var server = jpoker.serverCreate({ url: 'url' });
	server.callbacks[0] = [];
	server.rejoin(0);
	equals(server.callbacks[0].length, 1, 'rejoin callback registered');
	var callback = server.callbacks[0][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'rejoin callback still in place');
    });

test("jpoker.server.refresh clearInterval", function(){
	expect(2);
	
	var server = jpoker.serverCreate({ url: 'url' });
	var oldTimer = 42;
	var newTimer = 43;
	jpokerRefresh = jpoker.refresh;
	jpoker.refresh = function() {
	    jpoker.refresh = jpokerRefresh;
	    return {timer:newTimer};
	};
	server.clearInterval = function(id) {
	    equals(id, oldTimer, 'timer cleared');
	};
	server.timers.foo = { timer: oldTimer };
	server.refresh('foo');
	equals(server.timers.foo.timer, newTimer, 'timer updated');
    });

test("jpoker.server.stopRefresh clearInterval", function(){
	expect(2);
	
	var server = jpoker.serverCreate({ url: 'url' });
	var newTimer = 43;
	jpokerRefresh = jpoker.refresh;
	jpoker.refresh = function() {
	    jpoker.refresh = jpokerRefresh;
	    return {timer:newTimer};
	};
	server.clearInterval = function(id) {
	    equals(id, newTimer, 'timer cleared');
	};
	server.refresh('foo');
	server.stopRefresh('foo');
	equals(server.timers.foo, undefined, 'timer tag cleared');
    });

test("jpoker.server.login", function(){
        expect(9);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        equals(server.loggedIn(), false);
        equals(server.pinging(), false);

        var packets = [];
        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: '[{"type": "PacketAuthOk"}, {"type": "PacketSerial", "serial": 1}]',

            handle: function(packet) { packets.push(packet); }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var logname = "name";
        server.login(logname, "password");
        server.registerUpdate(function(server, what, packet) {
                switch(packet.type) {
                case "PacketSerial":
                    equals(packets[0].indexOf('PacketLogin') >= 0, true, 'Login');
                    equals(server.loggedIn(), true, "loggedIn");
                    equals(server.userInfo.name, logname, "logname");
                    equals(server.pinging(), true, "pinging");
                    equals(server.session != 'clear', true, "has session");
                    equals(server.connected(), true, "connected");
                    start_and_cleanup();
                    return false;

                case "PacketConnectionState":
                    equals(server.connected(), true, "connected");
                    return true;

                default:
                    throw "unexpected packet type " + packet.type;
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
            start_and_cleanup();
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
            start_and_cleanup();
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

        cleanup();
    });

test("jpoker.server.login waiting", function(){
        expect(2);
	
        var server = jpoker.serverCreate({ url: 'url' });
	server.callbacks[0] = [];
	server.login(0);
	equals(server.callbacks[0].length, 1, 'login callback registered');
	var callback = server.callbacks[0][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'login callback still in place');
    });

test("jpoker.server.logout", function(){
        expect(4);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        server.serial = 1;
        server.serial = "logname";
        server.connectionState = "connected";
        server.session = 42;
        equals(server.loggedIn(), true);
        server.registerUpdate(function(server, what, packet) {
                equals(server.loggedIn(), false);
                equals(server.userInfo.name, null, "logname");
                equals(packet.type, "PacketLogout");
                start_and_cleanup();
            });
        server.logout();
    });

test("jpoker.server.getUserInfo", function(){
        expect(2);
        var server = jpoker.serverCreate({ url: 'url' });
        var serial = 43;
        server.serial = serial;
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerGetUserInfo');
            equals(packet.serial, serial, 'player serial');
        };
        server.getUserInfo();
        cleanup();
    });

test("jpoker.server.bankroll", function(){
        expect(5);

        var server = jpoker.serverCreate({ url: 'url' });
        var money = 43;
        var in_game = 44;
        var points = 45;
        var currency_serial = 1;
        var packet = { type: 'PacketPokerUserInfo', 'money': { } };
        var currency_key = 'X' + currency_serial;
        packet.money[currency_key] = [ money * 100, in_game * 100, points ];
        server.handler(server, 0, packet);
        equals(server.userInfo.money[currency_key][0], money * 100, 'money');
        equals(server.bankroll(currency_serial), 0, 'bankroll');
        var player_serial = 3;
        server.serial = player_serial;
        equals(server.bankroll(33333), 0, 'no bankroll for currency');
        equals(server.bankroll(currency_serial), money, 'bankroll');

	var game_id = 100;
        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);	
        var table = server.tables[game_id];
	table.currency_serial = currency_serial;
        server.handler(server, 0, packet);
	equals(table.buyIn.bankroll, money, 'table.buyIn.bankroll');

        cleanup();
    });

test("jpoker.server.tourneyJoin", function(){
        expect(2);
	
	var game_id = 42;
        var server = jpoker.serverCreate({ url: 'url' });
        server.tourneyJoin(game_id);
	ok(game_id in server.tourneys, 'tourney created');
	ok(server.tourneys[game_id].pollTimer != -1, 'tourney pollTimer activated');
	cleanup();
    });

test("jpoker.server.tourneyRegister", function(){
        expect(4);
	stop();

        var serial = 43;
        var game_id = 2;
	var TOURNEY_REGISTER_PACKET = {'type': 'PacketPokerTourneyRegister',
				       'serial': serial,
				       'game_id': game_id};

        var server = jpoker.serverCreate({ url: 'url' });

        server.serial = serial;
	
        server.sendPacket = function(packet) {
	    if (packet.type == 'PacketPokerPoll') {
		return;
	    }
            equals(packet.type, 'PacketPokerTourneyRegister');
            equals(packet.serial, serial, 'player serial');
            equals(packet.game_id, game_id, 'tournament id');
	    equals(server.getState(), server.TOURNEY_REGISTER);
	    server.queueIncoming([TOURNEY_REGISTER_PACKET]);
        };
        server.registerUpdate(function(server, what, packet) {
		if (packet.type == 'PacketPokerTourneyRegister') {
		    server.timers = {'tourneyDetails': 
				     { timer: 0, 
				       request: start_and_cleanup }
		    };
		    return false;
		}
		return true;
            });
        server.tourneyRegister(game_id);
    });

test("jpoker.server.tourneyRegister error", function(){
        expect(1);
	stop();

        var serial = 43;
        var game_id = 2;
	var ERROR_PACKET = {'message':'server error message','code': 2,'type':'PacketError','other_type':jpoker.packetName2Type.PACKET_POKER_TOURNEY_REGISTER};

        var server = jpoker.serverCreate({ url: 'url' });

        server.serial = serial;
        server.sendPacket = function(packet) {
	    server.queueIncoming([ERROR_PACKET]);
        };
	dialog = jpoker.dialog;
	jpoker.dialog = function(message) {
	    equals(message, _("Player {serial} already registered in tournament {game_id}").supplant({game_id:game_id, serial:serial}));
	    jpoker.dialog = dialog;
	};
        server.registerUpdate(function(server, what, packet) {
		if (packet.type == 'PacketError') {
		    server.queueRunning(start_and_cleanup);
		    return false;
                }
		return true;
            });
        server.tourneyRegister(game_id);
    });

test("jpoker.server.tourneyRegister waiting", function(){
        expect(4);
	
        var server = jpoker.serverCreate({ url: 'url' });
	var game_id = 100;
	server.callbacks[0] = [];
	server.callbacks[game_id] = [];
	server.tourneyRegister(game_id);
	equals(server.callbacks[0].length, 1, 'tourneyRegister callbacks[0] registered');
	equals(server.callbacks[game_id].length, 1, 'tourneyRegister callbacks[game_id] registered');
	var callback = server.callbacks[0][0];
	var callback_game_id = server.callbacks[game_id][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'tourneyRegister callback still in place');
	server.notify(game_id, {type: 'PacketPing'});
	equals(server.callbacks[game_id][0], callback_game_id, 'tourneyRegister callback_game_id still in place');
	cleanup();
    });

test("jpoker.server.tourneyUnregister", function(){
        expect(4);
	stop();

        var serial = 43;
        var game_id = 2;
	var TOURNEY_REGISTER_PACKET = {'type': 'PacketPokerTourneyUnregister',
				       'serial': serial,
				       'game_id': game_id};

        var server = jpoker.serverCreate({ url: 'url' });

        server.serial = serial;
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerTourneyUnregister');
            equals(packet.serial, serial, 'player serial');
            equals(packet.game_id, game_id, 'tournament id');
	    equals(server.getState(), server.TOURNEY_REGISTER);
	    server.queueIncoming([TOURNEY_REGISTER_PACKET]);
        };
        server.registerUpdate(function(server, what, packet) {
		if (packet.type == 'PacketPokerTourneyUnregister') {
		    server.timers = {'tourneyDetails': 
				     { timer: 0, 
				       request: start_and_cleanup }
		    };
		    return false;
		}
		return true;
            });
        server.tourneyUnregister(game_id);
    });

test("jpoker.server.tourneyUnregister error", function(){
        expect(1);
	stop();

        var serial = 43;
        var game_id = 2;
	var ERROR_PACKET = {'message':'server error message','code':3,'type':'PacketError','other_type':117};

        var server = jpoker.serverCreate({ url: 'url' });

        server.serial = serial;
        server.sendPacket = function(packet) {
	    server.queueIncoming([ERROR_PACKET]);
        };
	dialog = jpoker.dialog;
	jpoker.dialog = function(message) {
	    equals(message, _("It is too late to unregister player {serial} from tournament {game_id}").supplant({game_id:game_id, serial:serial}));
	    jpoker.dialog = dialog;
	};
        server.registerUpdate(function(server, what, packet) {
		if (packet.type == 'PacketError') {
		    server.queueRunning(start_and_cleanup);
		    return false;
                }
		return true;
            });
        server.tourneyUnregister(game_id);
    });

test("jpoker.server.tourneyUnregister waiting", function(){
        expect(4);
	
        var server = jpoker.serverCreate({ url: 'url' });
	var game_id = 100;
	server.callbacks[0] = [];
	server.callbacks[game_id] = [];
	server.tourneyUnregister(game_id);
	equals(server.callbacks[0].length, 1, 'tourneyUnregister callbacks[0] registered');
	equals(server.callbacks[game_id].length, 1, 'tourneyUnregister callbacks[game_id] registered');
	var callback = server.callbacks[0][0];
	var callback_game_id = server.callbacks[game_id][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'tourneyUnregister callback still in place');
	server.notify(game_id, {type: 'PacketPing', id: game_id});
	equals(server.callbacks[game_id][0], callback_game_id, 'tourneyUnregister callback_game_id still in place');
	cleanup();
    });

test("jpoker.server.getPersonalInfo", function(){
        expect(3);
	stop();

        var serial = 42;
	var PERSONAL_INFO_PACKET = {'rating': 1000, 'firstname': '', 'money': {}, 'addr_street': '', 'phone': '', 'cookie': '', 'serial': serial, 'password': '', 'addr_country': '', 'name': 'testuser', 'gender': '', 'birthdate': '', 'addr_street2': '', 'addr_zip': '', 'affiliate': 0, 'lastname': '', 'addr_town': '', 'addr_state': '', 'type': 'PacketPokerPersonalInfo', 'email': ''};

        var server = jpoker.serverCreate({ url: 'url' });

        server.serial = serial;
	
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerGetPersonalInfo');
            equals(packet.serial, serial, 'player serial');
	    equals(server.getState(), server.PERSONAL_INFO);
	    server.queueIncoming([PERSONAL_INFO_PACKET]);
        };
        server.registerUpdate(function(server, what, packet) {
		if (packet.type == 'PacketPokerPersonalInfo') {
		    server.queueRunning(start_and_cleanup);
		    return false;
		}
		return true;
	    });
        server.getPersonalInfo();
    });

test("jpoker.server.getPersonalInfo not logged", function(){
        expect(1);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });

        server.serial = 0;

        dialog = jpoker.dialog;
        jpoker.dialog = function(message) {
            equals(message.indexOf("must be logged in") >= 0, true, "should be logged");
            jpoker.dialog = dialog;
            start_and_cleanup();
        };	
        server.getPersonalInfo();
    });


test("jpoker.server.getPersonalInfo waiting", function(){
        expect(2);
	
        var server = jpoker.serverCreate({ url: 'url' });
	server.serial = 42;
	var game_id = 100;
	server.callbacks[0] = [];
	server.getPersonalInfo(game_id);
	equals(server.callbacks[0].length, 1, 'getPersonalInfo callbacks[0] registered');
	var callback = server.callbacks[0][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'getPersonalInfo callback still in place');
    });

test("jpoker.server.getPlayerPlaces", function(){
        expect(5);
	stop();

        var serial = 42;
	var PLAYER_PLACES_PACKET = {type: 'PacketPokerPlayerPlaces', serial: 42, tables:[11, 12, 13], tourneys:[21, 22, 23]};

        var server = jpoker.serverCreate({ url: 'url' });

        server.serial = serial;
	
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerGetPlayerPlaces');
            equals(packet.serial, serial, 'player serial');
	    equals(server.getState(), server.PLACES);
	    server.queueIncoming([PLAYER_PLACES_PACKET]);
        };
        server.registerUpdate(function(server, what, packet) {
		if (packet.type == 'PacketPokerPlayerPlaces') {
		    equals(packet.tables[0], 11, 'packet.tables');
		    equals(packet.tourneys[0], 21, 'packet.tourneys');
		    server.queueRunning(start_and_cleanup);		    
		    return false;
		}
		return true;
	    });
        server.getPlayerPlaces();
    });

test("jpoker.server.getPlayerPlaces with serial argument", function(){
        expect(5);
	stop();

        var serial = 42;
	var PLAYER_PLACES_PACKET = {type: 'PacketPokerPlayerPlaces', serial: 42, tables:[11, 12, 13], tourneys:[21, 22, 23]};

        var server = jpoker.serverCreate({ url: 'url' });

        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerGetPlayerPlaces');
            equals(packet.serial, serial, 'player serial');
	    equals(server.getState(), server.PLACES);
	    server.queueIncoming([PLAYER_PLACES_PACKET]);
        };
        server.registerUpdate(function(server, what, packet) {
		if (packet.type == 'PacketPokerPlayerPlaces') {
		    equals(packet.tables[0], 11, 'packet.tables');
		    equals(packet.tourneys[0], 21, 'packet.tourneys');
		    server.queueRunning(start_and_cleanup);		    
		    return false;
		}
		return true;
	    });
        server.getPlayerPlaces(serial);
    });

test("jpoker.server.getPlayerPlaces not logged", function(){
        expect(1);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });

        server.serial = 0;

        dialog = jpoker.dialog;
        jpoker.dialog = function(message) {
            equals(message.indexOf("must be logged in") >= 0, true, "should be logged");
            jpoker.dialog = dialog;
            start_and_cleanup();
        };	
        server.getPlayerPlaces();
    });

test("jpoker.server.getPlayerPlaces waiting", function(){
        expect(2);
	
        var server = jpoker.serverCreate({ url: 'url' });
	server.serial = 42;
	var game_id = 100;
	server.callbacks[0] = [];
	server.getPlayerPlaces();
	equals(server.callbacks[0].length, 1, 'getPlayerPlaces callbacks[0] registered');
	var callback = server.callbacks[0][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'getPlayerPlaces callback still in place');
    });

test("jpoker.server.getPlayerPlacesByName", function(){
        expect(5);
	stop();

        var name = 'user';
	var PLAYER_PLACES_PACKET = {type: 'PacketPokerPlayerPlaces', name: name, tables:[11, 12, 13], tourneys:[21, 22, 23]};

        var server = jpoker.serverCreate({ url: 'url' });
	
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerGetPlayerPlaces');
            equals(packet.name, name, 'player name');
	    equals(server.getState(), server.PLACES);
	    server.queueIncoming([PLAYER_PLACES_PACKET]);
        };
        server.registerUpdate(function(server, what, packet) {
		if (packet.type == 'PacketPokerPlayerPlaces') {
		    equals(packet.tables[0], 11, 'places.tables');
		    equals(packet.tourneys[0], 21, 'places.tourneys');
		    server.queueRunning(start_and_cleanup);		    
		    return false;
		}
		return true;
	    });
        server.getPlayerPlacesByName(name);
    });

test("jpoker.server.getPlayerPlacesByName waiting", function(){
        expect(2);
	
        var server = jpoker.serverCreate({ url: 'url' });
	server.serial = 42;
	var game_id = 100;
	server.callbacks[0] = [];
	server.getPlayerPlacesByName('user');
	equals(server.callbacks[0].length, 1, 'getPlayerPlacesByName callbacks[0] registered');
	var callback = server.callbacks[0][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'getPlayerPlacesByName callback still in place');
    });

test("jpoker.server.getPlayerPlacesByName failed", function(){
        expect(4);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });

        dialog = jpoker.dialog;
        jpoker.dialog = function(message) {
            equals(message.indexOf("No such user: user999") >= 0, true, "no such user");
            jpoker.dialog = dialog;    
        };
	equals(server.callbacks[0].length, 1, 'no getPlayerPlacesByName callback yet');
        server.getPlayerPlacesByName('user999');
	equals(server.callbacks[0].length, 2, 'no getPlayerPlacesByName callback yet');
	server.notify(0, {type: 'PacketError', other_type: jpoker.packetName2Type.PACKET_POKER_PLAYER_PLACES});
	equals(server.callbacks[0].length, 1, 'getPlayerPlacesByName callback cleared');
	start_and_cleanup();
    });

test("jpoker.server.getPlayerPlacesByName failed no dialog", function(){
        expect(1);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });

        dialog = jpoker.dialog;
        jpoker.dialog = function(message) {
	    ok(false, 'dialog not called');
        };	
        server.getPlayerPlacesByName('user999', {dialog: false});
	server.registerUpdate(function(server, what, packet) {
		equals(packet.type, 'PacketError', 'packer error update call');
	    });
	server.notify(0, {type: 'PacketError', other_type: jpoker.packetName2Type.PACKET_POKER_PLAYER_PLACES});
	jpoker.dialog = dialog;
	start_and_cleanup();
    });

test("jpoker.server.getPlayerStats", function(){
        expect(5);
	stop();

        var serial = 42;
	var PLAYER_STATS_PACKET = {type: 'PacketPokerPlayerStats', serial:serial, rank: 100, percentile: 75};

        var server = jpoker.serverCreate({ url: 'url' });
	
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerGetPlayerStats');
            equals(packet.serial, serial, 'player serial');
	    equals(server.getState(), server.STATS);
	    server.queueIncoming([PLAYER_STATS_PACKET]);
        };
        server.registerUpdate(function(server, what, packet) {
		if (packet.type == 'PacketPokerPlayerStats') {
		    equals(packet.rank, 100, 'packet.rank');
		    equals(packet.percentile, 75, 'packet.percentile');
		    server.queueRunning(start_and_cleanup);
		    return false;
		}
		return true;
	    });
        server.getPlayerStats(serial);
    });

test("jpoker.server.getPlayerStats waiting", function(){
        expect(2);
	
        var server = jpoker.serverCreate({ url: 'url' });
	var game_id = 100;
	server.callbacks[0] = [];
	server.getPlayerStats(42);
	equals(server.callbacks[0].length, 1, 'getPlayerStats callbacks[0] registered');
	var callback = server.callbacks[0][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'getPlayerStats callback still in place');
    });

test("jpoker.server.selectTables", function(){
        expect(3);
	stop();

        var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": [{"observers": 1, "name": "One", "percent_flop" : 98, "average_pot": 1000, "seats": 10, "variant": "holdem", "hands_per_hour": 220, "betting_structure": "2-4-limit", "currency_serial": 1, "muck_timeout": 5, "players": 4, "waiting": 0, "skin": "default", "id": 100, "type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Two", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 101,"type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Three", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-pot-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 102,"type": "PacketPokerTable", "player_timeout": 60}]};

	var string = 'dummy';
        var server = jpoker.serverCreate({ url: 'url' });
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerTableSelect');
            equals(packet.string, string);
	    equals(server.getState(), server.TABLE_LIST);
	    server.queueIncoming([TABLE_LIST_PACKET]);
        };
        server.registerUpdate(function(server, what, packet) {
		if (packet.type == 'PacketPokerTableList') {
		    server.queueRunning(start_and_cleanup);
		    return false;
		}
		return true;
	    });
        server.selectTables(string);
    });

test("jpoker.server.selectTables waiting", function(){
        expect(2);
	
        var server = jpoker.serverCreate({ url: 'url' });
	server.serial = 42;
	var game_id = 100;
	server.callbacks[0] = [];
	server.selectTables('');
	equals(server.callbacks[0].length, 1, 'selectTables callbacks[0] registered');
	var callback = server.callbacks[0][0];
	server.notify(0, {type: 'PacketPing'});
	equals(server.callbacks[0][0], callback, 'selectTables callback still in place');
    });


test("jpoker.server.setPersonalInfo", function(){
        expect(8);
	stop();

        var serial = 42;
	var PERSONAL_INFO_PACKET = {'rating': 1000, 'firstname': 'John', 'money': {}, 'addr_street': '', 'phone': '', 'cookie': '', 'serial': serial, 'password': '', 'addr_country': '', 'name': 'testuser', 'gender': '', 'birthdate': '', 'addr_street2': '', 'addr_zip': '', 'affiliate': 0, 'lastname': 'Doe', 'addr_town': '', 'addr_state': '', 'type': 'PacketPokerPersonalInfo', 'email': ''};

        var server = jpoker.serverCreate({ url: 'url' });

        server.serial = serial;
	
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerSetAccount');
            equals(packet.serial, serial, 'player serial');
            equals(packet.firstname, 'John', 'firstname');
            equals(packet.lastname, 'Doe', 'lastname');
	    equals(packet.password, 'testpassword', 'password');
	    equals(server.getState(), server.PERSONAL_INFO);
	    server.queueIncoming([PERSONAL_INFO_PACKET]);
        };
        server.registerUpdate(function(server, what, packet) {
		if (packet.type == 'PacketPokerPersonalInfo') {
		    equals(packet.firstname, 'John');
		    equals(packet.lastname, 'Doe');
		    server.queueRunning(start_and_cleanup);
		    return false;
		}
		return true;
	    });
        server.setPersonalInfo({firstname: 'John',
		    lastname: 'Doe',
		    password: 'testpassword',
		    password_confirmation: 'testpassword'
		    });
    });

test("jpoker.server.setPersonalInfo password confirmation failed", function(){
        expect(1);
	stop();

        var serial = 42;

        var server = jpoker.serverCreate({ url: 'url' });

        server.serial = serial;
	
	dialog = jpoker.dialog;
	jpoker.dialog = function(message) {
	    equals(message, 'Password confirmation does not match');
	    jpoker.dialog = dialog;
	    start_and_cleanup();
	};
        server.setPersonalInfo({firstname: 'John',
		    lastname: 'Doe',
		    password: 'foo',
		    password_confirmation: 'bar'
		    });
    });

test("jpoker.server.setPersonalInfo error", function(){
        expect(1);
	stop();

	var serial = 42;
	var ERROR_PACKET = {'message':'server error message','code': 2,'type':'PacketError','other_type':jpoker.packetName2Type.PACKET_POKER_SET_ACCOUNT};
        var server = jpoker.serverCreate({ url: 'url' });

        server.serial = serial;
	
        server.sendPacket = function(packet) {
	    server.queueIncoming([ERROR_PACKET]);
        };
	dialog = jpoker.dialog;
	jpoker.dialog = function(message) {
	    equals(message, ERROR_PACKET.message);
	    jpoker.dialog = dialog;
	};
        server.registerUpdate(function(server, what, packet) {
		if (packet.type == 'PacketError') {
		    server.queueRunning(start_and_cleanup);
		    return false;
		}
		return true;
	    });
        server.setPersonalInfo({firstname: 'John',
		    lastname: 'Doe'
		    });
    });

test("jpoker.server.setInterval", function(){
	expect(1);
	stop();
	var server = jpoker.serverCreate({ url: 'url' });
	var id = server.setInterval(function() {
		ok(true, "callback called");
		clearInterval(id);
		start();
	    }, 0);	
    });

test("jpoker.server.setState", function(){
	expect(1);
	var server = jpoker.serverCreate({ url: 'url' });
	var undefinedState = undefined;
	var error = jpoker.error;
	jpoker.error = function(reason) {
            jpoker.error = error;
	    equals('undefined state', reason, 'error undefined state');
	};
	server.setState(undefined);	
    });

test("jpoker.server.urls", function() {
	expect(8);
	var server = jpoker.serverCreate({ url: 'http://host/POKER_REST' });
	equals(server.urls.avatar, 'http://host/AVATAR');
	equals(server.urls.upload, 'http://host/UPLOAD');
	
	server = jpoker.serverCreate({ url: '/POKER_REST' });
	equals(server.urls.avatar, '/AVATAR');
	equals(server.urls.upload, '/UPLOAD');

	server = jpoker.serverCreate({ url: 'url' });
	equals(server.urls.avatar, 'AVATAR');
	equals(server.urls.upload, 'UPLOAD');

	server = jpoker.serverCreate({ url: 'url', urls: {avatar: 'avatar', upload: 'upload'}});
	equals(server.urls.avatar, 'avatar');
	equals(server.urls.upload, 'upload');
    });

test("jpoker.server.error: throw correct exception", function() {
        expect(2);
	var jpokerAlert = jpoker.alert;
	var jpokerConsole = jpoker.console;	
	jpoker.console = undefined;
	jpoker.alert = function(e) {
	    jpoker.alert = jpokerAlert;
	    equals(e, 'dummy error');
	};
	var server = jpoker.serverCreate({ url: 'url' });
	server.state = 'unknown';
	server.registerHandler(0, function() {
	    server.notifyUpdate({});
	});
	server.registerUpdate(function() {
	    throw 'dummy error';
	});
	try {
	    server.handle(0, {});
	} catch (e) {
	    equals(e, 'dummy error');
	}
	jpoker.console = jpokerConsole;
	cleanup();
});

test("jpoker.server.init/uninit: state running", function() {
	expect(2);
	var server = jpoker.serverCreate({ url: 'url' });
	equals(server.state, 'running');
	server.state = 'dummy';
	server.uninit();
	equals(server.state, 'running');
	cleanup();
    });

test("jpoker.server.reset: call clearTimers", function() {
	expect(1);
	var server = jpoker.serverCreate({ url: 'url' });
	server.clearTimers = function() {
	    ok(true, "clearTimers called");
	};
	server.reset();
	server.clearTimers = function() {};
	server.uninit();
	cleanup();
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
        equals(self.connectionState, 'disconnected');
        self.ping();
        var ping_count = 0;
        self.registerUpdate(function(server, what, data) {
                equals(server.connectionState, 'connected');
                if(++ping_count >= 2) {
                    server.reset();
                    start();
                } else {
                    server.connectionState = 'disconnected';
                }
                return true;
            });
    });

test("jpoker.connection:ping frequency", function(){
        expect(5);
        //
        // The next ping occurs N seconds after the last packet was sent
        //
        var clock = 10;
        jpoker.now = function() { return clock++; };
        var self = new jpoker.connection();
        self.sendPacket = function() { equals(1,0,'sendPacket called'); };
        sentTime = self.sentTime = jpoker.now();
        self.setTimeout = function(fun, when) { 
            equals(when, self.pingFrequency - 1);
        };
        self.ping();
        equals(sentTime, self.sentTime, 'sentTime');
        //
        // The next ping occurs after pingFrequency 
        //
        clock = 200000;
        self.sendPacket = function() { equals(12,12); };
        self.sentTime = 0;
        self.setTimeout = function(fun, when) { 
            equals(when, self.pingFrequency);
        };
        self.ping();
        self.reset();
	equals(0, self.sentTime, 'sentTime reset');
    });

test("jpoker.connection:sendPacket error 404", function(){
        expect(1);
        stop();
        var self = new jpoker.connection();
        
        var error = jpoker.error;
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
        
        var error = jpoker.error;
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
            equals(this.connectionState, 'disconnected');
            start();
        };
        self.connectionState = 'connected';
        ActiveXObject.defaults.timeout = true;
        self.sendPacket({type: 'type'});
        ActiveXObject.defaults.timeout = false;
    });

test("jpoker.connection:sendPacket", function(){
        expect(7);
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
        equals(self.sentTime, 0, "sentTime default");
        self.sendPacket(packet);

        equals(self.sentTime > 0, true, "sentTime updated");
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
        expect(4);
        var self = new jpoker.connection();
	equals(self.dequeueFrequency, 100, 'dequeueFrequency default');

        var clock = 1;
        jpoker.now = function() { return clock++; };
        var timercalled = false;
        self.clearTimeout = function(id) { };
        self.setTimeout = function(cb, delay) {
	    equals(delay, self.dequeueFrequency, 'setTimeout(dequeueFrequency)');
	    timercalled = true;
	};

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
        expect(7);
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
            return true;
        };
        self.registerHandler(0, handler);
	jpoker.verbose = 2;
	jpokerMessage = jpoker.message;
	jpoker.message = function(message) {
	    ok(message.indexOf('connection handle') >= 0, 'jpoker.message called');
	    jpoker.message = jpokerMessage;
	};
        self.dequeueIncoming();
        self.unregisterHandler(0, handler);

        equals(self.queues[0], undefined);

        equals(handled[0], self);
        equals(handled[1], 0);
        equals(handled[2], packet);

        equals(0 in self.callbacks, false, 'not handlers for queue 0');

        equals(("time__" in packet), false);
    });

test("jpoker.connection:dequeueIncoming no handler", function(){
        expect(1);
        var self = new jpoker.connection();

        var packet = { type: 'type1', time__: 1 };
        self.queues[0] = { 'high': {'packets': [],
                                    'delay':  0 },
                           'low': {'packets': [packet],
                                   'delay': 0 } };
        self.dequeueIncoming();

        equals(self.queues[0] !== undefined, true, 'packet still in queue because no handler');
	self.queues = {};
    });

test("jpoker.connection:dequeueIncoming handle error", function(){
        expect(1);
        stop();
        var self = new jpoker.connection();

        var packet = { type: 'type1', time__: 1 };
        self.url = "jpoker.connection:dequeueIncoming handle error";
        self.queues[0] = { 'high': {'packets': [],
                                    'delay':  0 },
                           'low': {'packets': [packet],
                                   'delay': 0 } };
        var handler = function(com, id, packet) {
            throw "the error";
        };
        self.error = function(reason) {
            equals(reason, "the error");
            self.queues = {}; // prevent firing the incomingTimer
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
            return true;
        };
        self.registerHandler(0, handler);
        self.dequeueIncoming();
        self.unregisterHandler(0, handler);
        equals(handled[0], self);
        equals(handled[1], 0);
        equals(handled[2], packet);

        equals(0 in self.callbacks, false, 'not handlers for queue 0');
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
        cleanup();
    });

test("jpoker.connection:cookie protocol", function() {
	expect(2);
	var connection = new jpoker.connection();
	equals(connection.cookie(), document.cookie, 'cookie');
	equals(connection.protocol(), document.location.protocol, 'protocol');
    });

test("jpoker.connection:increment sessionCount", function() {
	expect(3);
	
	$.cookie('jpoker_count_'+jpoker.url2hash('url'), null);
	var server1 = new jpoker.connection({ url: 'url' });
	equals($.cookie('jpoker_count_'+jpoker.url2hash('url')), 1);
 	var server2 = new jpoker.connection({ url: 'url' });
	equals($.cookie('jpoker_count_'+jpoker.url2hash('url')), 2);
 	var server3 = new jpoker.connection({ url: 'url2' });
	equals($.cookie('jpoker_count_'+jpoker.url2hash('url2')), 1);
	
	cleanup();
    });

test("jpoker.connection: ajax arguments", function() {
	expect(2);
	var server = new jpoker.connection({ url: 'url' });
	server.ajax = function(options) {
	    ok(options.url.indexOf("name=") >= 0, 'name');
	    ok(options.url.indexOf("count=") >= 0, 'count');
	};
	server.sendPacket({});	
	cleanup();
    });

//
// jpoker.table
//
test("jpoker.table.init", function(){
        expect(5);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var game_id = 100;

        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: '[{"type": "PacketPokerTable", "id": ' + game_id + '}]',

            handle: function(packet) {
                if(packet.indexOf("PacketPing") >= 0 || packet.indexOf("PacketPokerExplain") >= 0 || packet.indexOf("PacketPokerPoll") >= 0) {
                    return;
                }
                equals(packet, '{"type":"PacketPokerTableJoin","game_id":' + game_id + '}');
            }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var handler = function(server, what, packet) {
            if(packet.type == "PacketPokerTable") {
                equals(packet.id, game_id);
                equals(game_id in server.tables, true, game_id + " created");
                equals(server.tables[game_id].id, game_id, "id");
		ok(server.tables[game_id].pollTimer != -1, "poll timer set");
                start_and_cleanup();
		return false;
            }
            return true;
        };
        server.registerUpdate(handler);
        server.tableJoin(game_id);
    });


test("jpoker.table.uninit", function(){
        expect(2);

        var server = jpoker.serverCreate({ url: 'url' });
        var game_id = 100;
        var table = new jpoker.table(server, { type: "PacketPokerTableJoin",
                                               game_id: game_id });
        server.tables[game_id] = table;
        var notified = false;
        var handler = function() {
            notified = true;
        };
        table.registerDestroy(handler);
        table.handler(server, game_id, { type: 'PacketPokerTableDestroy', game_id: game_id });
        equals(notified, true, 'destroy callback called');
        equals(game_id in server.tables, false, 'table removed from server');
    });

test("jpoker.table.reinit", function(){
        expect(4);

        var url = 'url';
        var server = jpoker.serverCreate({ url: url });

        var player_serial = 42;
        var player = new jpoker.player({ url: url }, { serial: player_serial });
        var player_uninit_called = false;
        player.uninit = function() { player_uninit_called = true; };

        var game_id = 73;
        var thing = 'a';
        var other_thing = 'b';
        var table = new jpoker.table(server, { id: game_id, thing: thing });
        table.serial2player[player_serial] = player;
        
        var callback = function(table, what, packet) {
            equals(table.id, game_id, 'table id');
            equals(table.thing, other_thing, 'some thing changed');
            equals(player_serial in table.serial2player, false, 'serial2player is reset');
        };

        table.registerReinit(callback);
        table.reinit({ id: game_id, thing: other_thing });
        equals(player_uninit_called, true, 'player was uninited');
    });


test("jpoker.table or tourney", function() {
	expect(2);
        var server = jpoker.serverCreate({ url: 'url' });
	var table = new jpoker.table(server, {"type": "PacketPokerTable", "id": 101, "betting_structure": "15-30-no-limit"});
	equals(table.is_tourney, false);
	var tourney = new jpoker.table(server, {"type": "PacketPokerTable", "id": 101, "betting_structure": "level-15-30-no-limit"});
	equals(tourney.is_tourney, true);
    });


test("jpoker.table.poll", function() {
	expect(9);
	var server = jpoker.serverCreate({ url: 'url' });
	var table = new jpoker.table(server, {"type": "PacketPokerTable", "id": 101, "betting_structure": "15-30-no-limit"});
	ok(server.pingFrequency > table.pollFrequency, 'pingFrequency > pollFrequency');
	equals(table.pollTimer, -1, 'pollTimer not set');

	server.sendPacket = function(packet) {
	    equals(packet.type, "PacketPokerPoll");
	    equals(packet.game_id, 101);
	};
	var callback;
	table.setTimeout = function(f) {
	    callback = f;
	    return 42;
	};
	table.clearTimeout = function(timer) {
	    equals(timer, -1, "clearTimeout called by poll");
	};
	table.poll();
	equals(table.pollTimer, 42, 'pollTimer set');

	table.poll = function() {
	    ok(true, "poll called by timeout callback");
	};
	callback();

	table.clearTimeout = function(timer) {
	    ok(true, "clearTimeout called by uninit");
	};
	table.uninit();
	equals(table.pollTimer, -1, 'pollTimer cleared by uninit');
	cleanup();
    });

test("jpoker.table.handler: PacketPokerState", function(){
        expect(1);

        var server = jpoker.serverCreate({ url: 'url' });
        var game_id = 100;

        // define table
        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        var state = 'pre-flop';
        var packet = { type: 'PacketPokerState',
                       game_id: game_id,
                       string: state
        };
        table.handler(server, game_id, packet);

        equals(table.state, state);
    });

test("jpoker.table.handler: PacketPokerBetLimit", function(){
        expect(6);

        var server = jpoker.serverCreate({ url: 'url' });
        var game_id = 100;

        // define user & money
        var player_serial = 22;
        server.serial = player_serial;

        // define table
        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        var packet = { type: 'PacketPokerBetLimit',
                       game_id: game_id,
                       min:   500,
                       max: 20000,
                       step:  100,
                       call: 1000,
                       allin:4000,
                       pot:  2000
        };
        table.handler(server, game_id, packet);

        var keys = [ 'min', 'max', 'step', 'call', 'allin', 'pot' ];
        for(var i = 0; i < keys.length; i++) {
            equals(table.betLimit[keys[i]] * 100, packet[keys[i]], keys[i]);
        }
    });

test("jpoker.table.handler: PacketPokerTableDestroy", function(){
        expect(5);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

	var send_auto_muck = jpoker.plugins.muck.sendAutoMuck;
	jpoker.plugins.muck.sendAutoMuck = function() {};

        place.jpoker('table', 'url', game_id);
        var player_serial = 43;
        server.handler(server, 0, { type: 'PacketSerial', serial: player_serial});
        var player_seat = 2;
        var player_name = 'username';
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', name: player_name, seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];

        equals($("#game_window" + id).size(), 1, 'game element exists');
        equals($("#seat" + player_seat + id).is(':visible'), true, 'seat visible');

        table.handler(server, game_id, { type: 'PacketPokerTableDestroy', game_id: game_id });

        equals(game_id in server.tables, false, 'table removed from server');
        equals(player_serial in table.serial2player, false, 'player removed from table');
        equals($("#game_window" + id).size(), 0, 'game element destroyed');

	jpoker.plugins.muck.sendAutoMuck = send_auto_muck;
	cleanup();
    });

test("jpoker.table.handler: PacketPokerTable", function(){
        expect(6);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

	var send_auto_muck = jpoker.plugins.muck.sendAutoMuck;
	jpoker.plugins.muck.sendAutoMuck = function() {};

        place.jpoker('table', 'url', game_id);
        var player_serial = 43;
        server.handler(server, 0, { type: 'PacketSerial', serial: player_serial});
        var player_seat = 2;
        var player_name = 'username';
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', name: player_name, seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];

        equals($("#game_window" + id).size(), 1, 'game element exists');
        equals($("#seat" + player_seat + id).is(':visible'), true, 'seat visible');

        //
        // table received and table already exists : reinit table
        //
        server.handler(server, game_id, { type: 'PacketPokerTable', game_id: game_id, id: game_id });

        equals(game_id in server.tables, true, 'table in server');
        equals(player_serial in table.serial2player, false, 'player removed from table');
        equals($("#game_window" + id).size(), 1, 'game element exists');
        equals($("#seat" + player_seat + id).is(':hidden'), true, 'seat hidden');

	jpoker.plugins.muck.sendAutoMuck = send_auto_muck;
	cleanup();
    });

test("jpoker.table.handler: PacketPokerBuyInLimits", function(){
        expect(5);

        var server = jpoker.serverCreate({ url: 'url' });
        var game_id = 100;

        // define user & money
        var player_serial = 22;
        server.serial = player_serial;
        var money = 43;
        var in_game = 44;
        var points = 45;
        var currency_serial = 440;
        var currency_key = 'X' + currency_serial;
        server.userInfo = { money: {} };
        server.userInfo.money[currency_key] = [ money * 100, in_game * 100, points ];

        // define table
        var table_packet = { id: game_id, currency_serial: currency_serial };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        var min = 100;
        var max = 200;
        var best = 300;
        var rebuy_min = 400;
        var packet = { type: 'PacketPokerBuyInLimits',
                       game_id: game_id,
                       min: min,
                       max: max,
                       best: best,
                       rebuy_min: rebuy_min
        };
        table.handler(server, game_id, packet);

        var keys = [ 'min', 'max', 'best', 'rebuy_min' ];
        for(var i = 0; i < keys.length; i++) {
            equals(table.buyIn[keys[i]] * 100, packet[keys[i]], keys[i]);
        }
        equals(table.buyIn.bankroll, money, 'money');
    });

test("jpoker.table.handler: PacketPokerBatchMode", function(){
        expect(1);
        var server = jpoker.serverCreate({ url: 'url' });

        var game_id = 100;	
        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        var packet = { 'type': 'PacketPokerBatchMode',
		       'game_id': game_id
        };

	table.handler(server, game_id, packet);
	ok(true, 'PacketPokerBatchMode');
    });

test("jpoker.table.handler: PacketPokerStreamMode", function(){
        expect(1);
        var server = jpoker.serverCreate({ url: 'url' });

        var game_id = 100;
        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        var packet = { 'type': 'PacketPokerStreamMode',
		       'game_id': game_id
        };

	server.state = 'unknown state';
	table.handler(server, game_id, packet);
	equals(server.getState(), 'running', 'state running');
    });

test("jpoker.table.handler: unknown table", function(){
        expect(1);
        var server = jpoker.serverCreate({ url: 'url' });

        var game_id = 100;
        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        var packet = { 'type': 'PacketPing',
                       'game_id': 101
        };

        jpokerMessage = jpoker.message;
        jpoker.message = function(message) {
            equals(message.indexOf("unknown table") >= 0, true, "unknown table");
            jpoker.message = jpokerMessage;
        };
	var verbose = jpoker.verbose;
	jpoker.verbose = 0;
	table.handler(server, game_id, packet);
	jpoker.verbose = verbose;
    });

//
// tourney
//
test("jpoker.tourney.init", function(){
        expect(5);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
	server.serial = 42;
        var game_id = 100;

        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: '[{"type": "PacketPokerTourneyRegister", "game_id": ' + game_id + ', "tag": "fixme"}]',

            handle: function(packet) {
		if(packet.indexOf("PacketPing") >= 0 || packet.indexOf("PacketPokerExplain") >= 0 || packet.indexOf("PacketPokerPoll") >= 0) {
                    return;
                }
                equals(packet, '{"type":"PacketPokerTourneyRegister","serial":42,"game_id":' + game_id + '}');
            }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var handler = function(server, what, packet) {
            if(packet.type == "PacketPokerTourneyRegister") {
                equals(packet.game_id, game_id);
                equals(game_id in server.tourneys, true, game_id + " created");
                equals(server.tourneys[game_id].game_id, game_id, "id");
		ok(server.tourneys[game_id].pollTimer != -1, "poll timer set");
                start_and_cleanup();
		return false;
            }
            return true;
        };
        server.registerUpdate(handler);
        server.tourneyRegister(game_id);
    });


test("jpoker.tourney.init registerHandler", function(){
	expect(2);
        var server = jpoker.serverCreate({ url: 'url' });
        var game_id = 100;
	var handlers = [];
	server.registerHandler = function(id, handler) {
	    handlers.push(id);
	};
        var tourney = new jpoker.tourney(server, game_id);
	equals(game_id, handlers[0], 'registerHandler(100)');
	equals(0, handlers[1], 'registerHandler(0)');
    });

test("jpoker.tourney.uninit", function(){
        expect(2);

        var server = jpoker.serverCreate({ url: 'url' });
        var game_id = 100;
        var tourney = new jpoker.tourney(server, game_id);
        server.tourneys[game_id] = tourney;
        var notified = false;
        var handler = function() {
            notified = true;
        };
        tourney.registerDestroy(handler);
        tourney.handler(server, game_id, { type: 'PacketPokerTourneyUnregister', game_id: game_id });
        equals(notified, true, 'destroy callback called');
        equals(game_id in server.tourneys, false, 'tourney removed from server');
    });

test("jpoker.tourney.uninit: PacketPokerTourneyFinish", function(){
        expect(2);

        var server = jpoker.serverCreate({ url: 'url' });
        var game_id = 100;
        var tourney = new jpoker.tourney(server, game_id);
        server.tourneys[game_id] = tourney;
        var notified = false;
        var handler = function() {
            notified = true;
        };
        tourney.registerDestroy(handler);
        tourney.handler(server, 0, { type: 'PacketPokerTourneyFinish', tourney_serial: game_id });
        equals(notified, true, 'destroy callback called');
        equals(game_id in server.tourneys, false, 'tourney removed from server');
    });

test("jpoker.tourney.poll", function() {
	expect(8);
	var server = jpoker.serverCreate({ url: 'url' });
	var tourney = new jpoker.tourney(server, 101);
	equals(tourney.pollTimer, -1, 'pollTimer not set');

	server.sendPacket = function(packet) {
	    equals(packet.type, "PacketPokerPoll");
	    equals(packet.tourney_serial, 101);
	};
	var callback;
	tourney.setTimeout = function(f) {
	    callback = f;
	    return 42;
	};
	tourney.clearTimeout = function(timer) {
	    equals(timer, -1, "clearTimeout called by poll");
	};
	tourney.poll();
	equals(tourney.pollTimer, 42, 'pollTimer set');
	
	tourney.poll = function() {
	    ok(true, "poll called by timeout callback");
	};
	callback();

	tourney.clearTimeout = function(timer) {
	    ok(true, "clearTimeout called by uninit");
	};
	tourney.uninit();
	equals(tourney.pollTimer, -1, 'pollTimer cleared by uninit');
	cleanup();
    });

test("jpoker.table.handler: PacketPokerShowdown", function(){
        expect(2);
        var server = jpoker.serverCreate({ url: 'url' });

        var game_id = 100;
        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
	equals(table.delay.showdown, jpoker.table.defaults.delay.showdown);

        var packet = { 'type': 'PacketPokerShowdown',
		       'game_id': game_id
        };
	var jpokerNow = jpoker.now;
	jpoker.now = function() {
	    return 42;
	};
	table.handler(server, game_id, packet);	
	equals(server.delays[game_id], 42+jpoker.table.defaults.delay.showdown, 'showdown delay');
	jpoker.now = jpokerNow;
	cleanup();
    });

test("jpoker.tourney.handler: unknown tourney", function(){
        expect(2);
        var server = jpoker.serverCreate({ url: 'url' });

        var game_id = 100;
        server.tourneys[game_id] = new jpoker.tourney(server, game_id);
        var tourney = server.tourneys[game_id];

        jpokerMessage = jpoker.message;
	var messages = [];
        jpoker.message = function(message) {
	    messages.push(message);
        };
	var verbose = jpoker.verbose;
	jpoker.verbose = 2;
	tourney.handler(server, game_id, { 'type': 'PacketPing', 'game_id': 101 });
	equals(messages[0].indexOf("tourney.handler") >= 0, true, "tourney handler");
	equals(messages[1].indexOf("packet discarded") >= 0, true, "unknown tourney");
	jpoker.verbose = verbose;
	jpoker.message = jpokerMessage;
    });

//
// player
//
test("jpoker.player.reinit", function(){
        expect(8);

        var serial = 42;
        var name = 'username';
        var url = 'url';
        var player = new jpoker.player({ url: url }, { serial: serial, name: name });
        equals(player.url, url, 'player.url is set');
        equals(player.serial, serial, 'player.serial is set');
        equals(player.name, name, 'player.name is set');
        var money = 10;
        player.money = money;

        var callback = function(player, what, packet) {
            equals(player.serial, other_serial, 'player serial changed');
            equals(player.money, 0, 'money reset');
        };

        var other_serial = 74;
        player.registerReinit(callback);
        player.reinit({ serial: other_serial });
        equals(player.serial, other_serial, 'player.serial is set');
        equals(player.name, name, 'player.name is set');
        equals(player.money, 0, 'player.money is reset');
    });

test("jpoker.player.sidepot", function(){
        expect(6);

        var serial = 42;
        var name = 'username';
        var url = 'url';
        var server = jpoker.serverCreate({ url: 'url' });
	var game_id = 42;
        var player = new jpoker.player({ url: url }, { serial: serial, name: name });
	player.handler(server, game_id, {'type': 'PacketPokerPlayerChips', 'money': 0, 'bet': 10000});
	var player2 = new jpoker.player({ url: url }, { serial: serial+1, name: name+'1' });
	player2.handler(server, game_id, {'type': 'PacketPokerPlayerChips', 'money': 0, 'bet': 10000});
	var player3 = new jpoker.player({ url: url }, { serial: serial+2, name: name+'2' });
	player3.handler(server, game_id, {'type': 'PacketPokerPlayerChips', 'money': 100000, 'bet': 10000});
	player.sit = true;
	player2.sit = true;
	player3.sit = true;

	var packet = {'type': 'PacketPokerPotChips', 'index': 1, 'bet': [1, 20000]};
	player.handler(server, game_id, packet);
	equals(player.side_pot.bet, 200, 'player side pot set');
	player2.handler(server, game_id, packet);
	equals(player2.side_pot.bet, 200, 'player2 side pot set');
	player3.handler(server, game_id, packet);
	equals(player3.side_pot, undefined, 'player3 side pot not set');

	player.handler(server, game_id, {'type': 'PacketPokerPotChips', 'index': 2, 'bet': [1, 40000]});
	equals(player.side_pot.bet, 200, 'player side pot not updated');

	player.handler(server, game_id, {'type': 'PacketPokerChipsPotReset'});
	equals(player.side_pot, undefined, 'side pot reset');

	player.sit = false;
	player.handler(server, game_id, {'type': 'PacketPokerPotChips', 'index': 2, 'bet': [1, 40000]});
	equals(player.side_pot, undefined, 'side pot reset');
    });

test("jpoker.player.stats", function(){
	expect(4);
        var serial = 42;
        var name = 'username';
        var url = 'url';
        var server = jpoker.serverCreate({ url: url });
	var game_id = 100;
	var packet = {"type": "PacketPokerTable", "id": 100};
	server.tables[packet.id] = new jpoker.table(server, packet);
        var player = new jpoker.player({ url: url }, { serial: serial, name: name });
	equals(undefined, player.stats);
	server.tables[packet.id].serial2player[serial] = player;
	server.handler(server, 0, {type: 'PacketPokerPlayerStats', serial: serial, rank: 1, percentile: 99});
	equals(99, player.stats.percentile);
	equals(1, player.stats.rank);
	player.reset();
	equals(undefined, player.stats);
    });

//
// tableList
//
test("jpoker.plugins.tableList", function(){
        expect(11);
        stop();

        //
        // Mockup server that will always return TABLE_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

        var average_pot = 1535 / 100;
        var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": [{"observers": 1, "name": "One", "percent_flop" : 98, "average_pot": average_pot * 100, "seats": 10, "variant": "holdem", "hands_per_hour": 220, "betting_structure": "2-4-limit", "currency_serial": 1, "muck_timeout": 5, "players": 4, "waiting": 0, "skin": "default", "id": 100, "type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Two", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 101,"type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Three", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-pot-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 102,"type": "PacketPokerTable", "player_timeout": 60}]};

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TABLE_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
        equals('update' in server.callbacks, false, 'no update registered');
        place.jpoker('tableList', 'url', { delay: 30 });
        equals(server.callbacks.update.length, 1, 'tableList update registered');
        server.registerUpdate(function(server, what, data) {		
                var element = $("#" + id);
                if(element.length > 0) {
                    var tr = $("#" + id + " tr", place);
                    equals(tr.length, 4);
                    equals($('td:nth-child(5)', tr[1]).text(), average_pot, 'average pot');
		    var row_id = TABLE_LIST_PACKET.packets[1].id + id;
		    var row = $("#" + row_id, place);
		    server.tableJoin = function(id) {
			equals(id, TABLE_LIST_PACKET.packets[1].id, 'tableJoin called');
		    };
		    row.click();
		    row.trigger('mouseenter');
		    equals(row.hasClass('hover'), true, 'hasClass hover');
		    row.trigger('mouseleave');
		    equals(row.hasClass('hover'), false, '!hasClass hover');
                    $("#" + id).remove();
                    return true;
                } else {
                    equals(server.callbacks.update.length, 2, 'tableList and test update registered');
                    equals('tableList' in server.timers, false, 'timer active');
                    server.setTimeout = function(fun, delay) { };
                    window.setTimeout(function() {
                            start_and_cleanup();
                        }, 30);
                    return false;
                }
            });
        server.registerDestroy(function(server) {
                equals('tableList' in server.timers, false, 'timer killed');
                equals(server.callbacks.update.length, 0, 'update & destroy unregistered');
            });
    });


test("jpoker.plugins.tableList link pattern", function(){
        expect(1);
        stop();

        //
        // Mockup server that will always return TABLE_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

        var average_pot = 1535 / 100;
        var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": [{"observers": 1, "name": "One", "percent_flop" : 98, "average_pot": average_pot * 100, "seats": 10, "variant": "holdem", "hands_per_hour": 220, "betting_structure": "2-4-limit", "currency_serial": 1, "muck_timeout": 5, "players": 4, "waiting": 0, "skin": "default", "id": 100, "type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Two", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 101,"type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Three", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-pot-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 102,"type": "PacketPokerTable", "player_timeout": 60}]};

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TABLE_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
	var link_pattern = 'http://foo.com/table?game_id={game_id}';
        place.jpoker('tableList', 'url', { delay: 30, link_pattern: link_pattern});
        server.registerUpdate(function(server, what, data) {		
                var element = $("#" + id);
                if(element.length > 0) {
		    var game_id = TABLE_LIST_PACKET.packets[1].id;
		    var row_id = game_id + id;
		    var row = $("#" + row_id, element);
		    server.tableJoin = function(id) {
			ok(false, 'tableJoin');
		    };
		    row.click();
		    var link = link_pattern.supplant({game_id: TABLE_LIST_PACKET.packets[1].id});
		    ok($('td:nth-child(1)', row).html().indexOf(link)>=0, link);
                    $("#" + id).remove();
                    return true;
                } else {
		    start_and_cleanup();
                    return false;
                }
            });
    });

test("jpoker.plugins.tableList pager", function(){
        expect(6);
        stop();

        //
        // Mockup server that will always return TABLE_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

        var average_pot = 1535 / 100;
        var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": []};
	for (var i = 0; i < 200; ++i) {
	    var name = "Table" + i;
	    var game_id = 100+i;
	    var players = i%11;
	    var packet = {"observers": 0, "name": name, "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": players, "waiting": 0, "skin": "default", "id": game_id,"type": "PacketPokerTable", "player_timeout": 60};
	    TABLE_LIST_PACKET.packets.push(packet);
	}

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TABLE_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
        place.jpoker('tableList', 'url', { delay: 30 });
        server.registerUpdate(function(server, what, data) {		
                var element = $("#" + id);
                if(element.length > 0) {
		    equals($('.pager', element).length, 1, 'has pager');
		    equals($('.pager .current', element).length, 1, 'has current page');
		    ok($('.pager li:last', element).html().indexOf("&gt;&gt;") >= 0, 'has next page');
		    $('.pager li:last a', element).click();
		    ok($('.pager li:first', element).html().indexOf("&lt;&lt;") >= 0, 'has previous page');
		    var row_id = TABLE_LIST_PACKET.packets[10].id + id;
		    var row = $("#" + row_id, place);
		    equals(row.length, 1, 'row element');
		    server.tableJoin = function(id) {
			equals(id, TABLE_LIST_PACKET.packets[10].id, 'tableJoin called');
		    };
		    row.click();
                    $("#" + id).remove();
                    return true;
                } else {
		    start_and_cleanup();
                    return false;
                }
            });
    });

test("jpoker.plugins.tableList no table no tablesorter", function(){
        expect(1);
        stop();

        //
        // Mockup server that will always return TABLE_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

        var average_pot = 1535 / 100;
        var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": []};

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TABLE_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
        place.jpoker('tableList', 'url', { delay: 30 });
        server.registerUpdate(function(server, what, data) {		
                var element = $("#" + id);
                if(element.length > 0) {
		    equals($('.header', element).length, 0, 'no tablesorter');
                    $("#" + id).remove();
                    return true;
                } else {
		    start_and_cleanup();
                    return false;
                }
            });
    });

test("jpoker.plugins.tableList getHTML should not list tourney table", function(){
        expect(2);

        var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": []};
	TABLE_LIST_PACKET.packets.push({"observers":0,"name":"Cayrryns","percent_flop":0,"average_pot":0,"skin":"default","variant":"holdem","hands_per_hour":0,"betting_structure":"100-200-no-limit","currency_serial":1,"muck_timeout":5,"players":0,"waiting":0,"tourney_serial":0,"seats":10,"player_timeout":60,"type":"PacketPokerTable","id":40});
	TABLE_LIST_PACKET.packets.push({"observers":0,"name":"sitngo21","percent_flop":0,"average_pot":0,"skin":"default","variant":"holdem","hands_per_hour":0,"betting_structure":"level-15-30-no-limit","currency_serial":0,"muck_timeout":5,"players":2,"waiting":0,"tourney_serial":2,"seats":2,"player_timeout":60,"type":"PacketPokerTable","id":41});
	
	var id = jpoker.uid();
	var element = $('<div class=\'jpoker_table_list\' id=\'' + id + '\'></div>').appendTo("#main");
	element.html(jpoker.plugins.tableList.getHTML(id, TABLE_LIST_PACKET));
	equals($("table tbody tr", element).length, 1, 'one table');
	equals($("table tbody tr td").html(), "Cayrryns");
	cleanup(id);
    });

//
// regularTourneyList
//
test("jpoker.plugins.regularTourneyList", function(){
        expect(13);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_LIST_PACKET = {"players": 0, "packets": [{"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 1, "sit_n_go": "y", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval" : 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 39, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first" : 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 40, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial" : 41, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 42, "sit_n_go": "n", "registered": 0}], "tourneys": 5, "type": "PacketPokerTourneyList"};
	var start_time = new Date(TOURNEY_LIST_PACKET.packets[1].start_time).toLocaleString();
	var state = TOURNEY_LIST_PACKET.packets[1].state;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var row_id = TOURNEY_LIST_PACKET.packets[1].serial + id;
        var place = $("#main");
        equals('update' in server.callbacks, false, 'no update registered');
        place.jpoker('regularTourneyList', 'url', { delay: 30 });
        equals(server.callbacks.update.length, 1, 'regularTourneyList update registered');
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
                    var tr = $("#" + id + " tr", place);
                    var row = $("#" + row_id, place);
                    equals(tr.length, 4+1);
                    equals($('td:nth-child(5)', row).text(), start_time, 'start_time');
		    equals($('td:nth-child(6)', row).text(), state, 'state');
		    equals($('.headerSortDown', tr[0]).text(), 'Start Time', "headerSortDown");
		    server.tourneyRowClick = function(server, subpacket) {
			equals(subpacket.serial, TOURNEY_LIST_PACKET.packets[1].serial, 'tourneyRowClick called');
		    };
		    row.click();
		    row.trigger('mouseenter');
		    equals(row.hasClass('hover'), true, 'hasClass hover');
		    row.trigger('mouseleave');
		    equals(row.hasClass('hover'), false, '!hasClass hover');
                    $("#" + id).remove();
                    return true;
                } else {
                    equals(server.callbacks.update.length, 2, 'regularTourneyList and test update registered');
                    equals('tourneyList' in server.timers, false, 'timer active');
                    server.setTimeout = function(fun, delay) { };
                    window.setTimeout(function() {
                            start_and_cleanup();
                        }, 30);
                    return false;
                }
            });
        server.registerDestroy(function(server) {
                equals('tourneyList' in server.timers, false, 'timer killed');
                equals(server.callbacks.update.length, 0, 'update & destroy unregistered');
            });
    });

test("jpoker.plugins.regularTourneyList link_pattern", function(){
        expect(1);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_LIST_PACKET = {"players": 0, "packets": [{"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 1, "sit_n_go": "y", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval" : 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 39, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first" : 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 40, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial" : 41, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 42, "sit_n_go": "n", "registered": 0}], "tourneys": 5, "type": "PacketPokerTourneyList"};
	var start_time = TOURNEY_LIST_PACKET.packets[1].start_time;
	var state = TOURNEY_LIST_PACKET.packets[1].state;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var row_id = TOURNEY_LIST_PACKET.packets[1].serial + id;
        var place = $("#main");
	var link_pattern = 'http://foo.com/tourney?tourney_serial={tourney_serial}';
        place.jpoker('regularTourneyList', 'url', { delay: 30, link_pattern: link_pattern });
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
                    var row = $("#" + row_id, place);
		    server.tourneyRowClick = function(server, subpacket) {
			ok(false, 'tourneyRowClick disabled');
		    };
		    row.click();
		    var link = link_pattern.supplant({tourney_serial: TOURNEY_LIST_PACKET.packets[1].serial});
		    ok($('td:nth-child(1)', row).html().indexOf(link)>=0, link);
                    $("#" + id).remove();
                    return true;
                } else {
		    start_and_cleanup();
                    return false;
                }
            });
    });

test("jpoker.plugins.regularTourneyList pager", function(){
        expect(6);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_LIST_PACKET = {"players": 0, "packets": [], "tourneys": 5, "type": "PacketPokerTourneyList"};
	for (var i = 0; i < 200; ++i) {
	    var name = "Tourney" + i;
	    var serial = 100+i;
	    var players = i%11;
	    var packet = {"players_quota": players, "breaks_first": 7200, "name": name, "description_short" : name, "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": serial, "sit_n_go": "n", "registered": 0};
	    TOURNEY_LIST_PACKET.packets.push(packet);
	}

	var start_time = TOURNEY_LIST_PACKET.packets[1].start_time;
	var state = TOURNEY_LIST_PACKET.packets[1].state;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var row_id = TOURNEY_LIST_PACKET.packets[1].serial + id;
        var place = $("#main");
        place.jpoker('regularTourneyList', 'url', { delay: 30 });
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
		    equals($('.pager', element).length, 1, 'has pager');
		    equals($('.pager .current', element).length, 1, 'has current page');
		    ok($('.pager li:last', element).html().indexOf("&gt;&gt;") >= 0, 'has next page');
		    $('.pager li:last a', element).click();
		    ok($('.pager li:first', element).html().indexOf("&lt;&lt;") >= 0, 'has previous page');
		    var row = $('table tr', place).eq(1);
		    equals(row.length, 1, 'row element');
		    server.tourneyRowClick = function(server, subpacket) {
			ok(true, 'tourneyRowClick called');
		    };
		    row.click();
                    $("#" + id).remove();
                    return true;
                } else {
		    start_and_cleanup();
                    return false;
                }
            });
    });

//
// sitngoTourneyList
//
test("jpoker.plugins.sitngoTourneyList", function(){
        expect(13);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_LIST_PACKET = {"players": 0, "packets": [{"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 1, "sit_n_go": "y", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval" : 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 39, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first" : 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 40, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial" : 41, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 42, "sit_n_go": "n", "registered": 0}], "tourneys": 5, "type": "PacketPokerTourneyList"};
	var buy_in = TOURNEY_LIST_PACKET.packets[0].buy_in/100;
	var state = TOURNEY_LIST_PACKET.packets[0].state;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var row_id = TOURNEY_LIST_PACKET.packets[0].serial + id;
        var place = $("#main");
        equals('update' in server.callbacks, false, 'no update registered');
        place.jpoker('sitngoTourneyList', 'url', { delay: 30 });
        equals(server.callbacks.update.length, 1, 'sitngoTourneyList update registered');
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
                    var tr = $("#" + id + " tr", place);
                    var row = $("#" + row_id, place);
                    equals(tr.length, 1+1);
                    equals($('td:nth-child(4)', row).text(), buy_in, 'buy in');
		    equals($('td:nth-child(5)', row).text(), state, 'state');
		    equals($('.headerSortDown', tr[0]).text(), 'Buy In', "headerSortDown");
		    server.tourneyRowClick = function(server, subpacket) {
			equals(subpacket.serial, TOURNEY_LIST_PACKET.packets[0].serial, 'tourneyRowClick called');
		    };
		    row.click();
		    row.trigger('mouseenter');
		    equals(row.hasClass('hover'), true, 'hasClass hover');
		    row.trigger('mouseleave');
		    equals(row.hasClass('hover'), false, '!hasClass hover');
                    $("#" + id).remove();
                    return true;
                } else {
                    equals(server.callbacks.update.length, 2, 'sitngoTourneyList and test update registered');
                    equals('tourneyList' in server.timers, false, 'timer active');
                    server.setTimeout = function(fun, delay) { };
                    window.setTimeout(function() {
                            start_and_cleanup();
                        }, 30);
                    return false;
                }
            });
        server.registerDestroy(function(server) {
                equals('tourneyList' in server.timers, false, 'timer killed');
                equals(server.callbacks.update.length, 0, 'update & destroy unregistered');
            });
    });

test("jpoker.plugins.sitngoTourneyList link pattern", function(){
        expect(1);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_LIST_PACKET = {"players": 0, "packets": [{"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 1, "sit_n_go": "y", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval" : 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 39, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first" : 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 40, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial" : 41, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 42, "sit_n_go": "n", "registered": 0}], "tourneys": 5, "type": "PacketPokerTourneyList"};
	var buy_in = TOURNEY_LIST_PACKET.packets[0].buy_in/100;
	var state = TOURNEY_LIST_PACKET.packets[0].state;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var row_id = TOURNEY_LIST_PACKET.packets[0].serial + id;
        var place = $("#main");
	var link_pattern = 'http://foo.com/tourney?tourney_serial={tourney_serial}';
        place.jpoker('sitngoTourneyList', 'url', { delay: 30, link_pattern: link_pattern });
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
                    var row = $("#" + row_id, place);
		    server.tourneyRowClick = function(server, subpacket) {
			ok(false, 'tourneyRowClick disabled');
		    };
		    row.click();
		    var link = link_pattern.supplant({tourney_serial: TOURNEY_LIST_PACKET.packets[0].serial});
		    ok($('td:nth-child(1)', row).html().indexOf(link)>=0, link);
                    $("#" + id).remove();
                    return true;
                } else {
		    start_and_cleanup();
                    return false;
                }
            });
    });

test("jpoker.plugins.sitngoTourneyList pager", function(){
        expect(6);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_LIST_PACKET = {"players": 0, "packets": [], "tourneys": 5, "type": "PacketPokerTourneyList"};
	for (var i = 0; i < 200; ++i) {
	    var name = "Tourney" + i;
	    var players = i%11;
	    var serial = i + 100;
	    var packet = {"players_quota": players, "breaks_first": 7200, "name": name, "description_short" : name, "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": serial, "sit_n_go": "y", "registered": 0};
	    TOURNEY_LIST_PACKET.packets.push(packet);
	}

	var start_time = TOURNEY_LIST_PACKET.packets[1].start_time;
	var state = TOURNEY_LIST_PACKET.packets[1].state;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var row_id = TOURNEY_LIST_PACKET.packets[1].serial + id;
        var place = $("#main");
        place.jpoker('sitngoTourneyList', 'url', { delay: 30 });
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
		    equals($('.pager', element).length, 1, 'has pager');
		    equals($('.pager .current', element).length, 1, 'has current page');
		    ok($('.pager li:last', element).html().indexOf("&gt;&gt;") >= 0, 'has next page');
		    $('.pager li:last a', element).click();
		    ok($('.pager li:first', element).html().indexOf("&lt;&lt;") >= 0, 'has previous page');
		    var row = $('table tr', place).eq(1);
		    equals(row.length, 1, 'row element');
		    server.tourneyRowClick = function(server, subpacket) {
			ok(true, 'tourneyRowClick called');
		    };
		    row.click();
                    $("#" + id).remove();
                    return true;
                } else {
		    start_and_cleanup();
                    return false;
                }
            });
    });

test("jpoker.plugins.regularTourneyList empty", function(){
        expect(2);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_LIST_PACKET = {"players": 0, "packets": [], "tourneys": 5, "type": "PacketPokerTourneyList"};

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
	var template = jpoker.plugins.regularTourneyList.templates.header;
	jpoker.plugins.regularTourneyList.templates.header = '<table><thead><tr><th>{description_short}</th></tr><tr><th>{registered}</th></tr></thead><tbody>';
        place.jpoker('regularTourneyList', 'url', { delay: 30 });
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
                    var tr = $("#" + id + " tr", place);
                    equals(tr.length, 2);
		    equals($(".header", element).length, 0, 'no tablesorter');
                    $("#" + id).remove();
                    return true;
                } else {
                    window.setTimeout(function() {
			    jpoker.plugins.regularTourneyList.templates.header = template;
                            start_and_cleanup();
                        }, 30);
                    return false;
                }
            });
    });

test("jpoker.plugins.sitngoTourneyList empty", function(){
        expect(2);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_LIST_PACKET = {"players": 0, "packets": [], "tourneys": 5, "type": "PacketPokerTourneyList"};

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
	var template = jpoker.plugins.sitngoTourneyList.templates.header;
	jpoker.plugins.sitngoTourneyList.templates.header = '<table><thead><tr><th>{description_short}</th></tr><tr><th>{registered}</th></tr></thead><tbody>';
        place.jpoker('sitngoTourneyList', 'url', { delay: 30 });
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
                    var tr = $("#" + id + " tr", place);
                    equals(tr.length, 2);
		    equals($(".header", element).length, 0, 'no tablesorter');
                    $("#" + id).remove();
                    return true;
                } else {
                    window.setTimeout(function() {
                            start_and_cleanup();
                        }, 30);
                    return false;
                }
            });
    });

//
// tourneyDetails
//
test("jpoker.plugins.tourneyDetails", function(){
        expect(9);
        stop();

        var PokerServer = function() {};

	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 140, "table_serial": 606, "name": "user1", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4]}, "type": 149, "tourney": {"registered": 1, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "registering", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var tourney_serial = TOURNEY_MANAGER_PACKET.tourney_serial;
	var players_count = 1;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_MANAGER_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
        equals('update' in server.callbacks, false, 'no update registered');
	var display_done = jpoker.plugins.tourneyDetails.callback.display_done;
	jpoker.plugins.tourneyDetails.callback.display_done = function(element) {
	    jpoker.plugins.tourneyDetails.callback.display_done = display_done;
	    equals($(".jpoker_tourney_details_info", element).length, 1, 'display done called when DOM is done');
	};
        place.jpoker('tourneyDetails', 'url', tourney_serial.toString());
        equals(server.callbacks.update.length, 1, 'tourneyDetails update registered');
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
                    var tr = $("#" + id + " .jpoker_tourney_details_players tr", place);
                    // +2 because 1 caption, 2 title
                    equals(tr.length, players_count+2, 'tourneyDetails players_count');
		    var input = $("#" + id + " .jpoker_tourney_details_register input");
		    equals(input.length, 0, 'no tourneyDetails register button');
                    $("#" + id).remove();
                    return true;
                } else {
                    equals(server.callbacks.update.length, 2, 'tourneyDetails and test update registered');
                    equals('tourneyDetails' in server.timers, false, 'timer active');
                    server.setTimeout = function(fun, delay) { };
                    window.setTimeout(function() {
                            start_and_cleanup();
                        }, 30);
                    return false;
                }
            });
        server.registerDestroy(function(server) {
                equals('tourneyDetails' in server.timers, false, 'timer killed');
                equals(server.callbacks.update.length, 0, 'update & destroy unregistered');
            });
    });

test("jpoker.plugins.tourneyDetails refresh should be < 10s", function(){
        expect(1);
        stop();

        var PokerServer = function() {};

	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 140, "table_serial": 606, "name": "user1", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4]}, "type": 149, "tourney": {"registered": 1, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "registering", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var tourney_serial = TOURNEY_MANAGER_PACKET.tourney_serial;
	var players_count = 1;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_MANAGER_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");	
	var options = {
	    setInterval: function(fn, interval) {
		ok(interval <= 10000, 'interval <= 10000');
		setTimeout(function() {
			$('#' + id).remove();
			server.notifyUpdate({});
			start_and_cleanup();
		    }, 0);	
	    }
	};
        place.jpoker('tourneyDetails', 'url', tourney_serial.toString(), '', options);
    });

test("jpoker.plugins.tourneyDetails pager", function(){
        expect(1);
        stop();

        var PokerServer = function() {};

	var TOURNEY_MANAGER_PACKET = {"user2properties": {}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4]}, "type": 149, "tourney": {"registered": 1, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "registering", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};
	for (var i = 0; i < 200; ++i) {
	    var player_money = 140+i;
	    var player_name = "user" + i;
	    var player_serial = 'X' + i;
	    TOURNEY_MANAGER_PACKET.user2properties[player_serial] = {"money": player_money, "table_serial": 606, "name": player_name, "rank": -1};
	}

	var tourney_serial = TOURNEY_MANAGER_PACKET.tourney_serial;
	var players_count = 1;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_MANAGER_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
        place.jpoker('tourneyDetails', 'url', tourney_serial.toString());
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
		    equals($('.pager', element).length, 0, 'has pager');
                    $("#" + id).remove();
                    return true;
                } else {
		    start_and_cleanup();
                    return false;
                }
            });
    });

test("jpoker.plugins.tourneyDetails no player no tablesorter", function(){
        expect(1);
        stop();

        var PokerServer = function() {};

	var TOURNEY_MANAGER_PACKET = {"user2properties": {}, "length": 3, "tourney_serial": 1, "table2serials": {}, "type": 149, "tourney": {"registered": 0, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "registering", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var tourney_serial = TOURNEY_MANAGER_PACKET.tourney_serial;
	var players_count = 1;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_MANAGER_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
        place.jpoker('tourneyDetails', 'url', tourney_serial.toString());
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
		    equals($('.header', element).length, 0, 'no tablesorter');
                    $("#" + id).remove();
                    return true;
                } else {
		    start_and_cleanup();
                    return false;
                }
            });
    });

test("jpoker.plugins.tourneyDetails templates no ranks no moneys", function(){
	expect(9);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": -1, "table_serial": 606, "name": "user1", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4]}, "type": 149, "tourney": {"registered": 1, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "running", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var is_logged = true;
	var is_registered = true;
	$(element).html(tourneyDetails.getHTML(id, packet, is_logged, is_registered));

	var name = $(" .jpoker_tourney_name", element);
	equals(name.html(), "Sit and Go 2 players, Holdem");

	var info = $(" .jpoker_tourney_details_info", element);
	var description = $(".jpoker_tourney_details_info_description", info);
	equals(description.html(), "Sit and Go 2 players");

	var registered = $(".jpoker_tourney_details_info_registered", info);
	equals(registered.html(), "1 players registered.");

	var seats_available = $(".jpoker_tourney_details_info_players_quota", info);
	equals(seats_available.html(), "2 players max.");	

	var buy_in = $(".jpoker_tourney_details_info_buy_in", info);
	equals(buy_in.html(), "Buy in: 3000");

	var tr = $(".jpoker_tourney_details_players tr", element);
        // +2 because 1 caption, 2 title
	equals(tr.length, 3, 'tourneyDetails players_count');

	var player = tr.eq(2);
	var player_name = $("td", player).eq(0);
	equals(player_name.html(), "user1");

	var money = $("td", player).eq(1);
	equals(money.html(), "");

	var rank = $("td", player).eq(2);
	equals(rank.html(), "");
	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates sitngo registering", function(){
	expect(1);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": -1, "table_serial": 606, "name": "user1", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4]}, "type": 149, "tourney": {"registered": 1, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "running", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var is_logged = true;
	var is_registered = true;
	$(element).html(tourneyDetails.getHTML(id, packet, is_logged, is_registered));

	var info = $(" .jpoker_tourney_details_info", element);

	var start_time = $(".jpoker_tourney_details_info_start_time", info);
	equals(start_time.length, 0, 'no start_time');

	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates regular registering", function(){
	expect(1);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": -1, "table_serial": 606, "name": "user1", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4]}, "type": 149, "tourney": {"registered": 1, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Regular", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "running", "buy_in": 300000, "add_on_count": 0, "description_short": "Regular", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "n", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var is_logged = true;
	var is_registered = true;
	$(element).html(tourneyDetails.getHTML(id, packet, is_logged, is_registered));

	var info = $(" .jpoker_tourney_details_info", element);

	var start_time = $(".jpoker_tourney_details_info_start_time", info);
	var date = new Date(packet.tourney.start_time).toLocaleString();
	equals(start_time.html(), "Start time: "+date);

	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates money and no ranks", function(){
	expect(4);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 100000, "table_serial": 606, "name": "user1", "rank": -1}, "X5": {"money": 100000, "table_serial": 606, "name": "user2", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4]}, "type": 149, "tourney": {"registered": 2, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "running", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};
	$.each(TOURNEY_MANAGER_PACKET.user2properties, function(serial, player) {
		player.money /= 100;
	    });

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = true;
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));

	var moneys = $(".jpoker_tourney_details_players tr td:nth-child(2)", element);
	equals(moneys.eq(0).html(), "1000");
	equals(moneys.eq(1).html(), "1000");

	var ranks = $(".jpoker_tourney_details_players tr td:nth-child(3)", element);
	equals(ranks.eq(0).html(), "");
	equals(ranks.eq(1).html(), "");
	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates ranks and no money", function(){
	expect(4);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": -1, "table_serial": 606, "name": "user1", "rank": 1}, "X5": {"money": -1, "table_serial": 606, "name": "user2", "rank": 2}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4]}, "type": 149, "tourney": {"registered": 2, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "running", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = true;
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));

	var moneys = $(".jpoker_tourney_details_players tr td:nth-child(2)", element);
	equals(moneys.eq(0).html(), "");
	equals(moneys.eq(1).html(), "");

	var ranks = $(".jpoker_tourney_details_players tr td:nth-child(3)", element);
	equals(ranks.eq(0).html(), "1");
	equals(ranks.eq(1).html(), "2");
	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates players", function(){
	expect(4);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": -1, "table_serial": 606, "name": "user1", "rank": 1}, "X5": {"money": -1, "table_serial": 606, "name": "user2", "rank": 2}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4]}, "type": 149, "tourney": {"registered": 2, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "running", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = true;

	packet.tourney.state = "registering";
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));
	equals($(".jpoker_tourney_details_players tr:nth-child(2) td", element).length, 1, "player when registering");

	packet.tourney.state = "running";
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));
	equals($(".jpoker_tourney_details_players tr:nth-child(2) th", element).length, 3, "player, money, ranks when running");

	packet.tourney.state = "complete";
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));
	equals($(".jpoker_tourney_details_players tr:nth-child(2) th", element).length, 2, "player, ranks when complete");
	equals($(".jpoker_tourney_details_players tr:nth-child(2) th:nth-child(2)", element).html(), "Rank", "ranks shown");

	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates tables", function(){
	expect(23);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 100000, "table_serial": 606, "name": "user1", "rank": -1}, "X5": {"money": 200000, "table_serial": 606, "name": "user2", "rank": -1}, "X6": {"money": 300000, "table_serial": 607, "name": "user3", "rank": -1}, "X7": {"money": 400000, "table_serial": 608, "name": "user3", "rank": -1}, "X8": {"money": 500000, "table_serial": 608, "name": "user4", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4,5], "X607": [6,7,8]}, "type": 149, "tourney": {"registered": 4, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "running", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};
	$.each(TOURNEY_MANAGER_PACKET.user2properties, function(serial, player) {
		player.money /= 100;
	    });

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = true;
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));

        equals($('.jpoker_tourney_details_info', element).hasClass('jpoker_tourney_details_running'), true, 'details_running');

	var headers = $(".jpoker_tourney_details_tables tr th", element);
	equals(headers.eq(0).html(), "Tables");
	equals(headers.eq(1).html(), "Table");
	equals(headers.eq(2).html(), "Players");
	equals(headers.eq(3).html(), "Max money");
	equals(headers.eq(4).html(), "Min money");
	equals(headers.eq(5).html(), "Go to table");

	var table1 = $(".jpoker_tourney_details_tables tr", element).eq(2);
	equals(table1.attr("id"), "X606");
	ok(table1.hasClass("jpoker_tourney_details_table"), "jpoker_tourney_details_table class");
	equals(table1.children().eq(0).html(), "606");
	equals(table1.children().eq(1).html(), "2");
	equals(table1.children().eq(2).html(), "2000");
	equals(table1.children().eq(3).html(), "1000");
	equals(table1.children().eq(4).find("input").attr("value"), "Go to table");

	var table2 = $(".jpoker_tourney_details_tables tr", element).eq(3);
	equals(table2.attr("id"), "X607");
	ok(table2.hasClass("jpoker_tourney_details_table"), "jpoker_tourney_details_table class");
	equals(table2.children().eq(0).html(), "607");
	equals(table2.children().eq(1).html(), "3");
	equals(table2.children().eq(2).html(), "5000");
	equals(table2.children().eq(3).html(), "3000");
	equals(table2.children().eq(4).find("input").attr("value"), "Go to table");

	
	var link_pattern = "http://foo.com/tourneytable?game_id={game_id}";
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered, link_pattern));

	var table1_link = $(".jpoker_tourney_details_tables tr", element).eq(2);
	var link1 = link_pattern.supplant({game_id: 606});
	ok(table1_link.children().eq(4).html().indexOf(link1) >= 0, link1);
	
	var table2_link = $(".jpoker_tourney_details_tables tr", element).eq(3);
	var link2 = link_pattern.supplant({game_id: 607});
	ok(table2_link.children().eq(4).html().indexOf(link2) >= 0, link2);

	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates tables registering", function(){
	expect(2);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": -1, "table_serial": -1, "name": "user1", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {}, "type": 149, "tourney": {"registered": 4, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "registering", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = true;
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));

	var tables = $(".jpoker_tourney_details_tables", element);
	equals(tables.length, 0);
        equals($('.jpoker_tourney_details_info', element).hasClass('jpoker_tourney_details_registering'), true, 'details_registering');
	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates table players", function(){
	expect(15);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 100000, "table_serial": 606, "name": "user1", "rank": -1}, "X5": {"money": 200000, "table_serial": 606, "name": "user2", "rank": -1}, "X6": {"money": 300000, "table_serial": 607, "name": "user3", "rank": -1}, "X7": {"money": 400000, "table_serial": 608, "name": "user4", "rank": -1}, "X8": {"money": 500000, "table_serial": 608, "name": "user5", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4,5], "X607": [6,7,8]}, "type": 149, "tourney": {"registered": 4, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "running", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};
	$.each(TOURNEY_MANAGER_PACKET.user2properties, function(serial, player) {
		player.money /= 100;
	    });

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = true;

	$(element).html(tourneyDetails.getHTMLTableDetails(id, packet, "X606"));

	var headers = $(".jpoker_tourney_details_table_players tr th", element);
	equals(headers.eq(0).html(), "Table");
	equals(headers.eq(1).html(), "Player");
	equals(headers.eq(2).html(), "Money");

	var table1 = $(".jpoker_tourney_details_table_players tr td", element);
	equals(table1.eq(0).html(), "user1");
	equals(table1.eq(1).html(), "1000");
	equals(table1.eq(2).html(), "user2");
	equals(table1.eq(3).html(), "2000");

	$(element).html(tourneyDetails.getHTMLTableDetails(id, packet, "X606"));

	var table1b = $(".jpoker_tourney_details_table_players tr td", element);
	equals(table1b.eq(1).html(), "1000");
	equals(table1b.eq(3).html(), "2000");

	$(element).html(tourneyDetails.getHTMLTableDetails(id, packet, "X607"));

	var table2 = $(".jpoker_tourney_details_table_players tr td", element);
	equals(table2.eq(0).html(), "user3");
	equals(table2.eq(1).html(), "3000");
	equals(table2.eq(2).html(), "user4");
	equals(table2.eq(3).html(), "4000");
	equals(table2.eq(4).html(), "user5");
	equals(table2.eq(5).html(), "5000");

	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates prizes", function(){
	expect(13);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 100000, "table_serial": 606, "name": "user1", "rank": -1}, "X5": {"money": 200000, "table_serial": 606, "name": "user2", "rank": -1}, "X6": {"money": 300000, "table_serial": 607, "name": "user3", "rank": -1}, "X7": {"money": 400000, "table_serial": 608, "name": "user3", "rank": -1}, "X8": {"money": 500000, "table_serial": 608, "name": "user4", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4,5], "X607": [6,7,8]}, "type": 149, "tourney": {"registered": 4, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "running", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0, "rank2prize": [1000000, 100000, 10000, 1000, 100]}, "type": "PacketPokerTourneyManager"};
	$.each(TOURNEY_MANAGER_PACKET.user2properties, function(serial, player) {
		player.money /= 100;
	    });
	$.each(TOURNEY_MANAGER_PACKET.tourney.rank2prize, function(i, prize) {
		TOURNEY_MANAGER_PACKET.tourney.rank2prize[i] /= 100;
	    });

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = true;
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));

	var headers = $(".jpoker_tourney_details_prizes tr th", element);
	equals(headers.eq(0).html(), "Prizes");
	equals(headers.eq(1).html(), "Rank");
	equals(headers.eq(2).html(), "Prize");

	var prizes = $(".jpoker_tourney_details_prizes tr td", element);
	equals(prizes.eq(0).html(), "1");
	equals(prizes.eq(1).html(), "10000");
	equals(prizes.eq(2).html(), "2");
	equals(prizes.eq(3).html(), "1000");
	equals(prizes.eq(4).html(), "3");
	equals(prizes.eq(5).html(), "100");
	equals(prizes.eq(6).html(), "4");
	equals(prizes.eq(7).html(), "10");
	equals(prizes.eq(8).html(), "5");
	equals(prizes.eq(9).html(), "1");

	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates prizes complete", function(){
	expect(2);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 100000, "table_serial": 606, "name": "user1", "rank": -1}, "X5": {"money": 200000, "table_serial": 606, "name": "user2", "rank": -1}, "X6f": {"money": 300000, "table_serial": 607, "name": "user3", "rank": -1}, "X7": {"money": 400000, "table_serial": 608, "name": "user3", "rank": -1}, "X8": {"money": 500000, "table_serial": 608, "name": "user4", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4,5], "X607": [6,7,8]}, "type": 149, "tourney": {"registered": 4, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "complete", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0, "rank2prize": [1000000, 100000, 10000, 1000, 100]}, "type": "PacketPokerTourneyManager"};
	$.each(TOURNEY_MANAGER_PACKET.user2properties, function(serial, player) {
		player.money /= 100;
	    });
	$.each(TOURNEY_MANAGER_PACKET.tourney.rank2prize, function(i, prize) {
		TOURNEY_MANAGER_PACKET.tourney.rank2prize[i] /= 100;
	    });

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = true;
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));

	equals($(".jpoker_tourney_details_prizes", element).length, 1);
        equals($('.jpoker_tourney_details_info', element).hasClass('jpoker_tourney_details_complete'), true, 'details_complete');

	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates prizes sitngo registering", function(){
	expect(2);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 100000, "table_serial": 606, "name": "user1", "rank": -1}, "X5": {"money": 200000, "table_serial": 606, "name": "user2", "rank": -1}, "X6f": {"money": 300000, "table_serial": 607, "name": "user3", "rank": -1}, "X7": {"money": 400000, "table_serial": 608, "name": "user3", "rank": -1}, "X8": {"money": 500000, "table_serial": 608, "name": "user4", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4,5], "X607": [6,7,8]}, "type": 149, "tourney": {"registered": 4, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "registering", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0, "rank2prize": [1000000, 100000, 10000, 1000, 100]}, "type": "PacketPokerTourneyManager"};
	$.each(TOURNEY_MANAGER_PACKET.user2properties, function(serial, player) {
		player.money /= 100;
	    });
	$.each(TOURNEY_MANAGER_PACKET.tourney.rank2prize, function(i, prize) {
		TOURNEY_MANAGER_PACKET.tourney.rank2prize[i] /= 100;
	    });

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = true;
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));

	equals($(".jpoker_tourney_details_prizes", element).length, 1);
        equals($('.jpoker_tourney_details_info', element).hasClass('jpoker_tourney_details_registering'), true, 'details_registering');

	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates prizes regular registering", function(){
	expect(2);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 100000, "table_serial": 606, "name": "user1", "rank": -1}, "X5": {"money": 200000, "table_serial": 606, "name": "user2", "rank": -1}, "X6f": {"money": 300000, "table_serial": 607, "name": "user3", "rank": -1}, "X7": {"money": 400000, "table_serial": 608, "name": "user3", "rank": -1}, "X8": {"money": 500000, "table_serial": 608, "name": "user4", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4,5], "X607": [6,7,8]}, "type": 149, "tourney": {"registered": 4, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "registering", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "n", "rebuy_delay": 0, "rank2prize": [1000000, 100000, 10000, 1000, 100]}, "type": "PacketPokerTourneyManager"};
	$.each(TOURNEY_MANAGER_PACKET.user2properties, function(serial, player) {
		player.money /= 100;
	    });
	$.each(TOURNEY_MANAGER_PACKET.tourney.rank2prize, function(i, prize) {
		TOURNEY_MANAGER_PACKET.tourney.rank2prize[i] /= 100;
	    });

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = true;
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));

	equals($(".jpoker_tourney_details_prizes", element).length, 0);
        equals($('.jpoker_tourney_details_info', element).hasClass('jpoker_tourney_details_registering'), true, 'details_registering');

	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates register", function(){
	expect(2);
	
	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 100000, "table_serial": 606, "name": "user1", "rank": -1}, "X5": {"money": 200000, "table_serial": 606, "name": "user2", "rank": -1}, "X6": {"money": 300000, "table_serial": 607, "name": "user3", "rank": -1}, "X7": {"money": 400000, "table_serial": 608, "name": "user3", "rank": -1}, "X8": {"money": 500000, "table_serial": 608, "name": "user4", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4,5], "X607": [6,7,8]}, "type": 149, "tourney": {"registered": 4, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "registering", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0, "rank2prize": [1000000, 100000, 10000, 1000, 100]}, "type": "PacketPokerTourneyManager"};

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = true;

	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));
	equals($(".jpoker_tourney_details_register", element).length, 1);

	packet.tourney.state = "running";
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));
	equals($(".jpoker_tourney_details_register", element).length, 0);

	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates buggy", function(){
	expect(1);

	var TOURNEY_MANAGER_PACKET = {"user2properties":{"X26":{"money":400000,"table_serial":723,"name":"BOTBoSwoi","rank":-1},"X27":{"money":-1,"table_serial":-1,"name":"BOTluhurs","rank":3},"X9":{"money":400000,"table_serial":723,"name":"proppy","rank":-1},"X20":{"money":-1,"table_serial":-1,"name":"proppy2","rank":4}},"length":3,"tourney_serial":24,"table2serials":{"X723":[9,26],"-1":[20,27]},"type":"PacketPokerTourneyManager","tourney":{"breaks_interval":3600,"currency_serial":1,"description_long":"Sit and Go 2 players","rank2prize":[840000,360000],"serial":24,"resthost_serial":0,"rebuy_count":0,"state":"running","buy_in":300000,"add_on_count":0,"description_short":"Sit and Go 2 players, Holdem","registered":4,"players_quota":4,"breaks_first":7200,"add_on":0,"start_time":1222693571,"rake":0,"variant":"holdem","players_min":4,"schedule_serial":1,"betting_structure":"level-15-30-no-limit","add_on_delay":60,"name":"sitngo2","finish_time":0,"prize_min":0,"player_timeout":60,"breaks_duration":300,"seats_per_game":2,"bailor_serial":0,"sit_n_go":"y","rebuy_delay":0},"uid__":"jpoker1222693551093"};

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = true;
	packet.tourney.state = "running";
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));
	equals(1, $(".jpoker_tourney_details_tables tbody tr", element).length, 'one table');
	cleanup();
    });

test("jpoker.plugins.tourneyDetails templates states announced break breakwait", function(){
	expect(12);

	var TOURNEY_MANAGER_PACKET = {"user2properties":{"X26":{"money":400000,"table_serial":723,"name":"BOTBoSwoi","rank":-1},"X27":{"money":-1,"table_serial":-1,"name":"BOTluhurs","rank":3},"X9":{"money":400000,"table_serial":723,"name":"proppy","rank":-1},"X20":{"money":-1,"table_serial":-1,"name":"proppy2","rank":4}},"length":3,"tourney_serial":24,"table2serials":{"X723":[9,26],"-1":[20,27]},"type":"PacketPokerTourneyManager","tourney":{"breaks_interval":3600,"currency_serial":1,"description_long":"Sit and Go 2 players","rank2prize":[840000,360000],"serial":24,"resthost_serial":0,"rebuy_count":0,"state":"running","buy_in":300000,"add_on_count":0,"description_short":"Sit and Go 2 players, Holdem","registered":4,"players_quota":4,"breaks_first":7200,"add_on":0,"start_time":1222693571,"rake":0,"variant":"holdem","players_min":4,"schedule_serial":1,"betting_structure":"level-15-30-no-limit","add_on_delay":60,"name":"sitngo2","finish_time":0,"prize_min":0,"player_timeout":60,"breaks_duration":300,"seats_per_game":2,"bailor_serial":0,"sit_n_go":"y","rebuy_delay":0},"uid__":"jpoker1222693551093"};

	var id = jpoker.uid();
	$("#main").append('<div class=\'jpoker_tourney_details\' id=\'' + id + '\'></div>');
	var tourneyDetails = jpoker.plugins.tourneyDetails;
	var element = document.getElementById(id);
	var packet = TOURNEY_MANAGER_PACKET;
	var logged = true;
	var registered = false;
	packet.tourney.state = "announced";
	packet.tourney.sit_n_go = "n";
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));
	equals($(".jpoker_tourney_details_tables", element).length, 0, 'tables');
	equals($(".jpoker_tourney_details_prizes", element).length, 0, 'prizes');
	equals($(".jpoker_tourney_details_players", element).length, 0, 'players');
	packet.tourney.state = "canceled";
	packet.tourney.sit_n_go = "n";
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));
	equals($(".jpoker_tourney_details_tables", element).length, 0, 'tables');
	equals($(".jpoker_tourney_details_prizes", element).length, 0, 'prizes');
	equals($(".jpoker_tourney_details_players", element).length, 0, 'players');
	packet.tourney.state = "break";
	packet.tourney.sit_n_go = "n";
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));
	equals($(".jpoker_tourney_details_tables", element).length, 1, 'tables');
	equals($(".jpoker_tourney_details_prizes", element).length, 1, 'prizes');
	equals($(".jpoker_tourney_details_players", element).length, 1, 'players');
	packet.tourney.state = "breakwait";
	packet.tourney.sit_n_go = "n";
	$(element).html(tourneyDetails.getHTML(id, packet, logged, registered));
	equals($(".jpoker_tourney_details_tables", element).length, 1, 'tables');
	equals($(".jpoker_tourney_details_prizes", element).length, 1, 'prizes');
	equals($(".jpoker_tourney_details_players", element).length, 1, 'players');
	cleanup();
    });

test("jpoker.plugins.tourneyDetails table details", function(){
        expect(5);
        stop();

        var PokerServer = function() {};

	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 100000, "table_serial": 606, "name": "user1", "rank": -1}, "X5": {"money": 200000, "table_serial": 606, "name": "user2", "rank": -1}, "X6": {"money": 300000, "table_serial": 607, "name": "user3", "rank": -1}, "X7": {"money": 400000, "table_serial": 608, "name": "user4", "rank": -1}, "X8": {"money": 500000, "table_serial": 608, "name": "user5", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4,5], "X607": [6,7,8]}, "type": 149, "tourney": {"registered": 4, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "running", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var tourney_serial = TOURNEY_MANAGER_PACKET.tourney_serial;
	var players_count = 1;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_MANAGER_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
	server.userInfo.name = "player10";
	server.serial = 42;
	var tourney_details_gethtml_table_details = jpoker.plugins.tourneyDetails.getHTMLTableDetails;
        place.jpoker('tourneyDetails', 'url', tourney_serial.toString());	
        server.registerUpdate(function(server, what, packet) {
                var element = $("#" + id);
                if(element.length > 0) {
		    equals($(".jpoker_tourney_details_table_details", element).length, 1);
		    var row = $(".jpoker_tourney_details_tables #X606", element);
		    jpoker.plugins.tourneyDetails.getHTMLTableDetails = function(id, packet, table){
			jpoker.plugins.tourneyDetails.getHTMLTableDetails = tourney_details_gethtml_table_details;
			equals(table, "X606");
			return "table details";
		    };
		    row.trigger('mouseenter');
		    equals(row.hasClass('hover'), true, 'hasClass hover');
		    row.trigger('mouseleave');
		    equals(row.hasClass('hover'), false, '!hasClass hover');
		    row.click();
		    equals($(".jpoker_tourney_details_table_details").html(), "table details");
		    element.remove();
		    return true;
		} else {
		    start_and_cleanup();
		    return false;
		}
            });
    });

test("jpoker.plugins.tourneyDetails goto table", function(){
        expect(3);
        stop();

        var PokerServer = function() {};

	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 100000, "table_serial": 606, "name": "user1", "rank": -1}, "X5": {"money": 200000, "table_serial": 606, "name": "user2", "rank": -1}, "X6": {"money": 300000, "table_serial": 607, "name": "user3", "rank": -1}, "X7": {"money": 400000, "table_serial": 608, "name": "user4", "rank": -1}, "X8": {"money": 500000, "table_serial": 608, "name": "user5", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4,5], "X607": [6,7,8]}, "type": 149, "tourney": {"registered": 4, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "running", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var tourney_serial = TOURNEY_MANAGER_PACKET.tourney_serial;
	var players_count = 1;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_MANAGER_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
	server.userInfo.name = "player10";
	server.serial = 42;
        place.jpoker('tourneyDetails', 'url', tourney_serial.toString());
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
		    equals($(".jpoker_tourney_details_table_details", element).length, 1);
		    var goto_table_element = $(".jpoker_tourney_details_tables #X606 .jpoker_tourney_details_tables_goto_table", element);
		    equals(goto_table_element.length, 1, 'goto table element');
		    server.tableJoin = function(game_id) {
			equals(game_id, 606, 'game_id 606');
		    };
		    goto_table_element.click();
		    element.remove();
		    return true;
		} else {
		    start_and_cleanup();		    
		    return false;
		}
            });
    });

test("jpoker.plugins.tourneyDetails goto table link_pattern", function(){
        expect(2);
        stop();

        var PokerServer = function() {};

	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 100000, "table_serial": 606, "name": "user1", "rank": -1}, "X5": {"money": 200000, "table_serial": 606, "name": "user2", "rank": -1}, "X6": {"money": 300000, "table_serial": 607, "name": "user3", "rank": -1}, "X7": {"money": 400000, "table_serial": 608, "name": "user4", "rank": -1}, "X8": {"money": 500000, "table_serial": 608, "name": "user5", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4,5], "X607": [6,7,8]}, "type": 149, "tourney": {"registered": 4, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "running", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var tourney_serial = TOURNEY_MANAGER_PACKET.tourney_serial;
	var players_count = 1;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_MANAGER_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
	server.userInfo.name = "player10";
	server.serial = 42;
	var link_pattern = 'http://foo.com/tourneytable?game_id={game_id}';
        place.jpoker('tourneyDetails', 'url', tourney_serial.toString(), 'tourney', {link_pattern: link_pattern});
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
		    equals($(".jpoker_tourney_details_table_details", element).length, 1);
		    var goto_table_element = $(".jpoker_tourney_details_tables #X606 .jpoker_tourney_details_tables_goto_table", element);
		    equals(goto_table_element.length, 1, 'goto table element');
		    server.tableJoin = function(game_id) {
			ok(false, 'tableJoin not bound');
		    };
		    goto_table_element.click();
		    element.remove();
		    return true;
		} else {
		    start_and_cleanup();		    
		    return false;
		}
            });
    });

test("jpoker.plugins.tourneyDetails packet money update", function(){
        expect(2);
        stop();

        var PokerServer = function() {};

	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 100000, "table_serial": 606, "name": "user1", "rank": -1}, "X5": {"money": 200000, "table_serial": 606, "name": "user2", "rank": -1}, "X6f": {"money": 300000, "table_serial": 607, "name": "user3", "rank": -1}, "X7": {"money": 400000, "table_serial": 608, "name": "user3", "rank": -1}, "X8": {"money": 500000, "table_serial": 608, "name": "user4", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4,5], "X607": [6,7,8]}, "type": 149, "tourney": {"registered": 4, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "complete", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0, "rank2prize": [1000000, 100000, 10000, 1000, 100]}, "type": "PacketPokerTourneyManager"};

	var tourney_serial = TOURNEY_MANAGER_PACKET.tourney_serial;
	var players_count = 1;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_MANAGER_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
	server.userInfo.name = "player10";
	server.serial = 42;
        place.jpoker('tourneyDetails', 'url', tourney_serial.toString());
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
		    var packet = data;
		    equals(packet.user2properties.X4.money, 1000);
		    equals(packet.tourney.rank2prize[0], 10000);
		    element.remove();
		    return true;
		} else {
		    start_and_cleanup();		    
		    return false;
		}
            });
    });

test("jpoker.plugins.tourneyDetails.register", function(){
        expect(2);
        stop();

        var PokerServer = function() {};

	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 140, "table_serial": 606, "name": "user1", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4]}, "type": 149, "tourney": {"registered": 1, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "registering", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var tourney_serial = TOURNEY_MANAGER_PACKET.tourney_serial;
	var players_count = 1;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_MANAGER_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
	server.userInfo.name = "player10";
	server.serial = 42;
        place.jpoker('tourneyDetails', 'url', tourney_serial.toString());
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
		    var input = $("#" + id + " .jpoker_tourney_details_register input");
		    equals(input.val(), "Register");
		    server.tourneyRegister = function(game_id) {
			equals(tourney_serial, game_id);
		    };
		    input.click();
		    element.remove();
		    return true;
		} else {
		    start_and_cleanup();		    
		    return false;
		}
            });
    });

test("jpoker.plugins.tourneyDetails.unregister", function(){
        expect(2);
        stop();

        var PokerServer = function() {};

	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 140, "table_serial": 606, "name": "user1", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4]}, "type": 149, "tourney": {"registered": 1, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "registering", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 0, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var tourney_serial = TOURNEY_MANAGER_PACKET.tourney_serial;
	var players_count = 1;
	var player_serial = 4;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_MANAGER_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
	server.userInfo.name = "player0";
	server.serial = player_serial;
        place.jpoker('tourneyDetails', 'url', tourney_serial.toString());
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
		    var input = $("#" + id + " .jpoker_tourney_details_register input");
		    equals(input.val(), "Unregister");
		    server.tourneyUnregister = function(game_id) {
			equals(tourney_serial, game_id);
		    };
		    input.click();
		    element.remove();
		    return true;
		} else {
		    start_and_cleanup();
		    return false;
		}
            });
    });

//
// tourneyPlaceholder
//
test("jpoker.plugins.tourneyPlaceholder", function(){
        expect(10);
        stop();

        var PokerServer = function() {};

	var TOURNEY_MANAGER_PACKET = {"user2properties": {"X4": {"money": 140, "table_serial": 606, "name": "user1", "rank": -1}}, "length": 3, "tourney_serial": 1, "table2serials": {"X606": [4]}, "type": 149, "tourney": {"registered": 1, "betting_structure": "level-15-30-no-limit", "currency_serial": 1, "description_long": "Sit and Go 2 players", "breaks_interval": 3600, "serial": 1, "rebuy_count": 0, "state": "registering", "buy_in": 300000, "add_on_count": 0, "description_short": "Sit and Go 2 players, Holdem", "player_timeout": 60, "players_quota": 2, "rake": 0, "add_on": 0, "start_time": 1220102053, "breaks_first": 7200, "variant": "holdem", "players_min": 2, "schedule_serial": 1, "add_on_delay": 60, "name": "sitngo2", "finish_time": 0, "prize_min": 0, "breaks_duration": 300, "seats_per_game": 2, "bailor_serial": 0, "sit_n_go": "y", "rebuy_delay": 0}, "type": "PacketPokerTourneyManager"};

	var tourney_serial = TOURNEY_MANAGER_PACKET.tourney_serial;
	var tourney_starttime = TOURNEY_MANAGER_PACKET.tourney.start_time;
	var players_count = 1;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_MANAGER_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
        equals('update' in server.callbacks, false, 'no update registered');
        place.jpoker('tourneyPlaceholder', 'url', tourney_serial.toString());
        equals(server.callbacks.update.length, 1, 'tourneyPlaceholder update registered');
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
		    ok(element.hasClass('jpoker_tourney_placeholder'), 'jpoker_tourney_placeholder');
		    equals($('.jpoker_tourney_placeholder_table', element).length, 1, 'table');
		    equals($('.jpoker_tourney_placeholder_starttime', element).length, 1, 'starttime');		    
		    var tourney_starttime_date = new Date(tourney_starttime*1000);
		    ok($('.jpoker_tourney_placeholder_starttime', element).html().indexOf(tourney_starttime_date.toLocaleString()) >= 0, $('.jpoker_tourney_placeholder_starttime', element).html());
                    $("#" + id).remove();
                    return true;
                } else {
                    equals(server.callbacks.update.length, 2, 'tourneyPlaceholder and test update registered');
                    equals('tourneyDetails' in server.timers, false, 'timer active');
		    start_and_cleanup();
                    return false;
                }
            });
        server.registerDestroy(function(server) {
                equals('tourneyPlaceholder' in server.timers, false, 'timer killed');
                equals(server.callbacks.update.length, 0, 'update & destroy unregistered');
	    });
    });

//
// featuredTable
//
test("jpoker.plugins.featuredTable", function(){
        expect(3);
        stop();

        var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": [{"observers": 1, "name": "One", "percent_flop" : 98, "average_pot": 1535, "seats": 10, "variant": "holdem", "hands_per_hour": 220, "betting_structure": "2-4-limit", "currency_serial": 1, "muck_timeout": 5, "players": 2, "waiting": 0, "skin": "default", "id": 100, "type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Two", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 101,"type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Three", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-pot-limit", "currency_serial": 1, "muck_timeout": 5, "players": 2, "waiting": 0, "skin": "default", "id": 102,"type": "PacketPokerTable", "player_timeout": 60}]};

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
	server.selectTables = function(string) {
	    equals(string, 'my', 'selectTables my');
	    server.selectTables = function(string) {
		server.tableJoin = function(game_id) {
		    equals(game_id, 100, 'game_id field');
		    start_and_cleanup();
		};
		setTimeout(function() {server.notifyUpdate(TABLE_LIST_PACKET);}, 0);
	    };
	    setTimeout(function() {
                    server.notifyUpdate({
                            'type': 'PacketPokerTableList',
                                'packets' : []
                                });
                        }, 0);
	    equals(server.callbacks.update.length, 1, 'callback registered');
	};
        place.jpoker('featuredTable', 'url');
    });

test("jpoker.plugins.featuredTable selectTable(my) not empty", function(){
        expect(2);
        stop();

        var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": [{"observers": 1, "name": "One", "percent_flop" : 98, "average_pot": 1535, "seats": 10, "variant": "holdem", "hands_per_hour": 220, "betting_structure": "2-4-limit", "currency_serial": 1, "muck_timeout": 5, "players": 2, "waiting": 0, "skin": "default", "id": 100, "type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Two", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 101,"type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Three", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-pot-limit", "currency_serial": 1, "muck_timeout": 5, "players": 2, "waiting": 0, "skin": "default", "id": 102,"type": "PacketPokerTable", "player_timeout": 60}]};

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
	server.selectTables = function(string) {
	    equals(string, 'my', 'selectTables my');
	    setTimeout(function() {
		    server.notifyUpdate({'type': 'PacketPokerTableList', 'packets' : [TABLE_LIST_PACKET]});
		    equals(server.callbacks.update.length, 0, 'no callback registered');
		    start_and_cleanup();
		    
		}, 0);
	};
        place.jpoker('featuredTable', 'url');
    });

test("jpoker.plugins.featuredTable waiting", function(){
        expect(3);
        stop();

        var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": [{"observers": 1, "name": "One", "percent_flop" : 98, "average_pot": 1535, "seats": 10, "variant": "holdem", "hands_per_hour": 220, "betting_structure": "2-4-limit", "currency_serial": 1, "muck_timeout": 5, "players": 2, "waiting": 0, "skin": "default", "id": 100, "type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Two", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 101,"type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Three", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-pot-limit", "currency_serial": 1, "muck_timeout": 5, "players": 2, "waiting": 0, "skin": "default", "id": 102,"type": "PacketPokerTable", "player_timeout": 60}]};

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
	server.selectTables = function(string) {
	    setTimeout(function() {
		    server.notifyUpdate({'type': 'PacketPing'});
		    equals(server.callbacks.update.length, 1, 'callback registered');
		    server.selectTables = function(string) {
			setTimeout(function() {
				server.notifyUpdate({'type': 'PacketPing'});
				equals(server.callbacks.update.length, 1, 'callback registered');
				server.notifyUpdate(TABLE_LIST_PACKET);
				equals(server.callbacks.update.length, 0, 'callback registered');
				start_and_cleanup();				
			    }, 0);
		    };
		    server.notifyUpdate({'type': 'PacketPokerTableList', 'packets': []});
		}, 0);
	};
        place.jpoker('featuredTable', 'url');
    });

//
// serverStatus
//
test("jpoker.plugins.serverStatus", function(){
	expect(8);

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
        server.playersCount = 12;
        server.tablesCount = 23;
	server.playersTourneysCount = 11;
	server.tourneysCount = 22;
        server.connectionState = 'connected';
        server.notifyUpdate();
	equals($("#" + id + " .jpoker_server_status_connected").size(), 1, "connected");

        content = $("#" + id).text();
	equals(content.indexOf("12") >= 0, true, "12 players");
	equals(content.indexOf("23") >= 0, true, "23 tables");
	equals(content.indexOf("11") >= 0, true, "11 players tourneys");
	equals(content.indexOf("22") >= 0, true, "22 tourneys");
        //
        // element destroyed
        //
        $("#" + id).remove();
        equals(server.callbacks.update.length, 1, "1 update callback");
        server.notifyUpdate();
        equals(server.callbacks.update.length, 0, "0 update callback");

        jpoker.uninit();
    });

//
// login
//
$.fn.triggerKeypress = function(keyCode) {
    return this.trigger("keypress", [$.event.fix({event:"keypress", keyCode: keyCode, target: this[0]})]);
};
$.fn.triggerKeydown = function(keyCode) {
    return this.trigger("keydown", [$.event.fix({event:"keydown", keyCode: keyCode, target: this[0]})]);
};

test("jpoker.plugins.login", function(){
        expect(10);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

	place.jpoker('login', 'url');
        var content = null;
        
	content = $("#" + id).text();
	equals(content.indexOf("user:") >= 0, true, "user:");

        var dialog;

        var expected = { name: 'logname', password: 'password' };

        $(".jpoker_login_submit", place).click();
        dialog = $("#jpokerDialog");
        equals(dialog.text().indexOf('user name must not be empty') >= 0, true, 'empty user name');

        $(".jpoker_login_name", place).attr('value', expected.name);
        $(".jpoker_login_signup", place).click();

        equals(dialog.text().indexOf('password must not be empty') >= 0, true, 'empty password');
        dialog.dialog('destroy');

        $(".jpoker_login_password", place).attr('value', expected.password);

        var result = { name: null, password: null };
        server.login = function(name, password) {
            result.name = name;
            result.password = password;
        };
        $("#" + id).triggerKeypress("13");
	content = $("#" + id).text();
        equals(content.indexOf("login in progress") >=0, true, "login in progress keypress");
        equals(result.name, expected.name, "login name");
        equals(result.password, expected.password, "login password");

        server.serial = 1;
        server.userInfo.name = 'logname';
        server.notifyUpdate();
	content = $("#" + id).text();
	equals(content.indexOf("logname logout") >= 0, true, "logout");
        equals(server.loggedIn(), true, "loggedIn");

        $("#" + id).click();
        equals(server.loggedIn(), false, "logged out");
	content = $("#" + id).text();
	equals(content.indexOf("user:") >= 0, true, "user:");

	$("#" + id).remove();
	server.notifyUpdate();

        cleanup(id);
    });

//
// table
//
test("jpoker.plugins.table", function(){
        expect(18);

	var packet = {"type": "PacketPokerTable", "id": 100};
        var server = jpoker.serverCreate({ url: 'url' });
	server.tables[packet.id] = new jpoker.table(server, packet);
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

        var game_id = 100;

        place.jpoker('table', 'url', game_id);
	content = $("#" + id).text();
	for(var seat = 0; seat < 10; seat++) {
	    equals($("#seat" + seat + id).size(), 1, "seat " + seat);
	}
	var names = jpoker.plugins.playerSelf.names;
	for(var name = 0; name < names.length; name++) {
	    equals($("#" + names[name] + id).css('display'), 'none', names[name]);
	}
	equals($('#jpokerSound').size(), 1, 'jpokerSound');
	content = $("#" + id).text();
    });

test("jpoker.plugins.table: info", function(){
        expect(8);
	var packet = {"type": "PacketPokerTable", "id": 100, "name": "One", "percent_flop" : 98, "betting_structure": "15-30-no-limit"};
        var server = jpoker.serverCreate({ url: 'url' });
	server.tables[packet.id] = new jpoker.table(server, packet);
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

        var game_id = 100;

        place.jpoker('table', 'url', game_id);

	var table_info_element = $('#table_info'+id);
	equals(table_info_element.length, 1, 'table info');
	equals($('.jpoker_table_info_name', table_info_element).length, 1, 'table info name');
	equals($('.jpoker_table_info_name', table_info_element).html(), 'One');
	equals($('.jpoker_table_info_flop', table_info_element).length, 1, 'table info flop');
	equals($('.jpoker_table_info_flop', table_info_element).html(), '98% Flop', 'table info flop');
	equals($('.jpoker_table_info_blind', table_info_element).length, 1, 'table info blind');
	equals($('.jpoker_table_info_blind', table_info_element).html(), '15-30-no-limit', 'table info blind');
	equals($('.jpoker_table_info_level', table_info_element).length, 0, 'table info level');

	cleanup();
    });

test("jpoker.plugins.table: info tourney", function(){
        expect(4);
	var packet = {"type": "PacketPokerTable", "id": 100, "name": "One", "percent_flop" : 98, "betting_structure": "level-15-30-no-limit"};
        var server = jpoker.serverCreate({ url: 'url' });
	var table = new jpoker.table(server, packet);
	server.tables[packet.id] = table;
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

        var game_id = 100;

        place.jpoker('table', 'url', game_id);

	var table_info_element = $('#table_info'+id);
	equals($('.jpoker_table_info_blind', table_info_element).length, 1, 'table info blind');
	equals($('.jpoker_table_info_blind', table_info_element).html(), 'level-15-30-no-limit', 'table info blind');
	equals($('.jpoker_table_info_level', table_info_element).length, 1, 'table info level');

	table.handler(server, game_id, { type: 'PacketPokerStart', game_id: game_id, level: 1 });
	equals($('.jpoker_table_info_level', table_info_element).html(), '1', 'table info level');

	cleanup();
    });

test("jpoker.plugins.table: PacketPokerStart callback.hand_start", function(){
        expect(1);
	stop();
	var packet = {"type": "PacketPokerTable", "id": 100, "name": "One", "percent_flop" : 98, "betting_structure": "15-30-no-limit"};
        var server = jpoker.serverCreate({ url: 'url' });
	var table = new jpoker.table(server, packet);
	server.tables[packet.id] = table;
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

        var game_id = 100;

        place.jpoker('table', 'url', game_id);

	var jpoker_table_callback_hand_start = jpoker.plugins.table.callback.hand_start;
	jpoker.plugins.table.callback.hand_start = function(packet) {
	    equals(packet.hands_count, 10, 'hand start callback');
	    jpoker.plugins.table.callback.hand_start = jpoker_table_callback_hand_start;
	    start_and_cleanup();
	};
	table.handler(server, game_id, { type: 'PacketPokerStart', game_id: game_id, hands_count: 10 });
    });


test("jpoker.plugins.table: PacketPokerTourneyBreak callback.tourney_break/resume", function(){
        expect(2);
	stop();
	var packet = {"type": "PacketPokerTable", "id": 100, "name": "One", "percent_flop" : 98, "betting_structure": "level-15-30-no-limit"};
        var server = jpoker.serverCreate({ url: 'url' });
	var table = new jpoker.table(server, packet);
	server.tables[packet.id] = table;
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

        var game_id = 100;

        place.jpoker('table', 'url', game_id);

	var jpoker_table_callback_tourney_break = jpoker.plugins.table.callback.tourney_break;
	jpoker.plugins.table.callback.tourney_break = function(packet) {
	    equals(packet.type, 'PacketPokerTableTourneyBreakBegin', 'tourney break callback');
	     jpoker.plugins.table.callback.tourney_break = jpoker_table_callback_tourney_break;
	};
	table.handler(server, game_id, { type: 'PacketPokerTableTourneyBreakBegin', game_id: game_id});
	var jpoker_table_callback_tourney_resume = jpoker.plugins.table.callback.tourney_resume;
	jpoker.plugins.table.callback.tourney_resume = function(packet) {
	    equals(packet.type, 'PacketPokerTableTourneyBreakDone', 'tourney resume callback');	    
	    jpoker.plugins.table.callback.tourney_resume = jpoker_table_callback_tourney_resume;
	    start_and_cleanup();
	};
	table.handler(server, game_id, { type: 'PacketPokerTableTourneyBreakDone', game_id: game_id});
    });

test("jpoker.plugins.table: PacketPokerTourneyBreak callback.tourney_break/resume default", function(){
        expect(3);
	var packet = {"type": "PacketPokerTable", "id": 100, "name": "One", "percent_flop" : 98, "betting_structure": "level-15-30-no-limit"};
        var server = jpoker.serverCreate({ url: 'url' });
	var table = new jpoker.table(server, packet);
	server.tables[packet.id] = table;
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

        var game_id = 100;

        place.jpoker('table', 'url', game_id);

	var resume_time = 1220979087*1000;
	table.handler(server, game_id, { type: 'PacketPokerTableTourneyBreakBegin', game_id: game_id, resume_time: 1220979087});
	ok($("#jpokerDialog").parents().is(':visible'), 'jpoker dialog visible');
	var date = new Date();
	date.setTime(resume_time);
	//console.log(date.toLocaleString());
	ok($("#jpokerDialog").html().indexOf(date.toLocaleString()) >= 0, $("#jpokerDialog").html());
	table.handler(server, game_id, { type: 'PacketPokerTableTourneyBreakDone', game_id: game_id});
	ok($("#jpokerDialog").parents().is(':hidden'), 'jpoker dialog hidden');
	cleanup(id);
    });

test("jpoker.plugins.table.reinit", function(){
        expect(17);

	var packet = {"type": "PacketPokerTable", "id": 100};
        var server = jpoker.serverCreate({ url: 'url' });
	server.tables[packet.id] = new jpoker.table(server, packet);
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

        var game_id = 100;

        place.jpoker('table', 'url', game_id);	
	content = $("#" + id).text();
	for(var seat = 0; seat < 10; seat++) {
	    equals($("#seat" + seat + id).size(), 1, "seat " + seat);
	}
	var names = jpoker.plugins.playerSelf.names;
	for(var name = 0; name < names.length; name++) {
	    equals($("#" + names[name] + id).css('display'), 'none', names[name]);
	}
	content = $("#" + id).text();
    });

test("jpoker.plugins.table.chat", function(){
        expect(10);

        var server = jpoker.serverCreate({ url: 'url' });
        var player_serial = 1;
        server.serial = player_serial; // pretend logged in
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var chat = $("#chat"+id+" .jpoker_chat_input");
        equals(chat.size(), 1, "chat DOM element");
        equals(chat.is(':hidden'), true, "chat hidden");
        table.handler(server, game_id,
                      {
                          type: 'PacketPokerPlayerArrive',
                              seat: 0,
                              serial: player_serial,
                              game_id: game_id,
                              name: 'username'
                              });
        equals(chat.is(':visible'), true, "chat visible");
        var sent = false;
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerChat');
            equals(packet.serial, player_serial);
            equals(packet.game_id, game_id);
            equals("^"+packet.message+"$", '^ABC$');
            sent = true;
        };
        $('input', chat).attr('value', 'A\'B"C');
        chat.triggerKeypress("13");
        equals(sent, true, "packet sent");
        equals($('input', chat).attr('value'), '', 'input is reset');
        table.handler(server, game_id, { type: 'PacketPokerPlayerLeave', seat: 0, serial: player_serial, game_id: game_id });
        equals(chat.is(':hidden'), true, "chat hidden (2)");
        cleanup(id);
    });

test("jpoker.plugins.table: PokerPlayerArrive/Leave (Self)", function(){
        expect(18);

        var server = jpoker.serverCreate({ url: 'url' });
        var player_serial = 1;
        server.serial = player_serial; // pretend logged in
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;
	
        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        $('#jpokerRebuy').remove(); // just in case it pre-existed
        place.jpoker('table', 'url', game_id);
        equals($("#seat0" + id).size(), 1, "seat0 DOM element");
        equals($("#seat0" + id).css('display'), 'none', "seat0 hidden");
        equals($("#sit_seat0" + id).css('display'), 'block', "sit_seat0 hidden");
        equals(table.seats[0], null, "seat0 empty");
        table.handler(server, game_id,
                      {
                          type: 'PacketPokerPlayerArrive',
                              seat: 0,
                              serial: player_serial,
                              game_id: game_id,
                              name: 'username',
			      url: 'http://mycustomavatar.png'
                              });
        equals($("#jpokerSound " + jpoker.sound).attr("src").indexOf('arrive') >= 0, true, 'sound arrive');
        equals($("#seat0" + id).css('display'), 'block', "arrive");
        equals($("#sit_seat0" + id).css('display'), 'none', "seat0 hidden");
        equals($("#player_seat0_name" + id).html(), 'click to sit', "username arrive");
        var avatar_image = $("#player_seat0_avatar" + id + " img").attr("src");
	ok(avatar_image.indexOf("mycustomavatar.png") >= 0, "custom avatar" + avatar_image);
	equals($("#player_seat0_avatar" + id + " img").attr('alt'), 'username', 'alt of seat0');
        equals(table.seats[0], player_serial, "player 1");
        equals(table.serial2player[player_serial].serial, player_serial, "player 1 in player2serial");
        var names = [ 'check', 'call', 'raise', 'fold' ];
        for(var i = 0; i < names.length; i++) {
            equals($("#" + names[i] + id).text(), names[i]);
        }
        table.handler(server, game_id, { type: 'PacketPokerPlayerLeave', seat: 0, serial: player_serial, game_id: game_id });
        equals($("#seat0" + id).css('display'), 'none', "leave");
        equals(table.seats[0], null, "seat0 again");
        cleanup(id);
    });

test("jpoker.plugins.table: PacketSerial/PacketLogout", function(){
        expect(4);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        equals($("#seat0" + id).css('display'), 'none', "seat0 hidden");
        equals($("#sit_seat0" + id).is(':hidden'), true, "sit_seat0 hidden");
        var player_serial = 43;
        server.handler(server, 0, { type: 'PacketSerial', serial: player_serial});
        equals($("#sit_seat0" + id).is(':visible'), true, "sit_seat0 visible");
        server.logout();
        equals($("#sit_seat0" + id).is(':hidden'), true, "sit_seat0 hidden");
        cleanup(id);
    });

test("jpoker.plugins.table: PacketPokerBoardCards", function(){
        expect(7);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        equals($("#board0" + id).size(), 1, "board0 DOM element");
        equals($("#board0" + id).css('display'), 'none', "board0 hidden");
        equals(table.board[0], null, "board0 empty");
        var card_value = 1;
        table.handler(server, game_id, { type: 'PacketPokerBoardCards', cards: [card_value], game_id: game_id });
        equals($("#board0" + id).css('display'), 'block', "card 1 set");
        equals($("#board0" + id).hasClass('jpoker_card_3h'), true, 'card_3h class');
        equals($("#board1" + id).css('display'), 'none', "card 2 not set");
        equals(table.board[0], card_value, "card in slot 0");
        start_and_cleanup();
    });

test("jpoker.plugins.table: PacketPokerTableQuit", function(){
        expect(6);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        equals($("#quit" + id).size(), 1, "quit DOM element");
        var sent = false;
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerTableQuit');
            equals(packet.game_id, game_id);
            sent = true;
        };
        server.setTimeout = function(callback, delay) { callback(); };
        equals($("#game_window" + id).size(), 1, 'game element exists');
        $("#quit" + id).click();
        equals(sent, true, "packet sent");
        equals($("#game_window" + id).size(), 0, 'game element destroyed');
        cleanup(id);
    });

test("jpoker.plugins.table: quit callback", function(){
	expect(1);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

	var callback = jpoker.plugins.table.callback.quit;
	jpoker.plugins.table.callback.quit = function(table) {
	    jpoker.plugins.table.callback.quit = callback;
	    equals(game_id, table.id, 'callback called');
	    start_and_cleanup();
	};
	
	place.jpoker('table', 'url', game_id);
        $("#quit" + id).click();       	
    });

test("jpoker.plugins.table: quit non running", function(){
	expect(1);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];	
	place.jpoker('table', 'url', game_id);
	server.setState('dummy');
        $("#quit" + id).click();

	var callback = jpoker.plugins.table.callback.quit;
	jpoker.plugins.table.callback.quit = function(table) {
	    jpoker.plugins.table.callback.quit = callback;
	    equals(server.state, 'running', 'server running');
	    start_and_cleanup();
	};
	setTimeout(function() {server.setState('running');}, 10);
    });

test("jpoker.plugins.table: PacketPokerDealer", function(){
        expect(6);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        equals($("#dealer0" + id).size(), 1, "dealer0 DOM element");
        equals($("#dealer0" + id).css('display'), 'none', "dealer0 hidden");
        table.handler(server, game_id, { type: 'PacketPokerDealer', dealer: 0, game_id: game_id });
        equals($("#dealer0" + id).css('display'), 'block', "dealer 0 set");
        equals($("#dealer1" + id).css('display'), 'none', "dealer 1 not set");
        table.handler(server, game_id, { type: 'PacketPokerDealer', dealer: 1, game_id: game_id });
        equals($("#dealer0" + id).css('display'), 'none', "dealer 0 not set");
        equals($("#dealer1" + id).css('display'), 'block', "dealer 1 set");
        start_and_cleanup();
    });

test("jpoker.plugins.table: PacketPokerChat", function(){
        expect(15);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 1;
        var player_seat = 2;
        var player_name = 'username';
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id, name: player_name });
	var chat_element = $("#chat" + id);
        equals(chat_element.size(), 1, "chat history DOM element");
        equals($(".jpoker_chat_history_dealer", chat_element).size(), 1, "chat history DOM element");
        equals($(".jpoker_chat_history_player", chat_element).size(), 1, "chat history DOM element");
        var message = 'voila\ntout';
        table.handler(server, game_id, { type: 'PacketPokerChat', message: message, game_id: game_id, serial: player_serial });
        var chat_history_player = $(".jpoker_chat_history_player", chat_element);
	var chat_lines = $(".jpoker_chat_line", chat_history_player);
	equals(chat_lines.length, 2);
	equals($(".jpoker_chat_prefix", chat_lines.eq(0)).html(), "username: ");
	equals($(".jpoker_chat_message", chat_lines.eq(0)).html(), "tout");	
	equals($(".jpoker_chat_prefix", chat_lines.eq(1)).html(), "username: ");
	equals($(".jpoker_chat_message", chat_lines.eq(1)).html(), "voila");
        equals($(".jpoker_chat_history_dealer").text(), "", "no dealer message");
	$(".jpoker_chat_history_player").text("");

	var dealer_message = 'Dealer: voila\nDealer: tout\n';
        table.handler(server, game_id, { type: 'PacketPokerChat', message: dealer_message, game_id: game_id, serial: 0 });	
        var chat_history_dealer = $(".jpoker_chat_history_dealer", chat_element);
	var chat_lines_dealer = $(".jpoker_chat_line", chat_history_dealer);
	equals(chat_lines_dealer.length, 2);
	equals($(".jpoker_chat_prefix", chat_lines_dealer.eq(0)).html(), "Dealer: ");
	equals($(".jpoker_chat_message", chat_lines_dealer.eq(0)).html(), "tout");	
	equals($(".jpoker_chat_prefix", chat_lines_dealer.eq(1)).html(), "Dealer: ");
	equals($(".jpoker_chat_message", chat_lines_dealer.eq(1)).html(), "voila");
        equals($(".jpoker_chat_history_player").text(), "", "no player message");

        cleanup();
    });

test("jpoker.plugins.table: PacketPokerPosition", function(){
        expect(12);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        var player_name = 'username';
        for(var i = 1; i <= 3; i++) {
            table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: i, serial: i * 10, game_id: game_id, name: player_name + i });
            table.serial2player[i * 10].sit = true;
        }

        place.jpoker('table', 'url', game_id);

        var seat;
        for(seat = 1; seat <= 3; seat++) {
            var c = "#player_seat" + seat + id;
            equals($(c).size(), 1, "seat length " + seat);
            equals($(c).hasClass('jpoker_position'), false, "seat " + seat);
        }
        table.handler(server, game_id, { type: 'PacketPokerPosition', serial: 10, game_id: game_id });
        equals($("#player_seat1" + id).hasClass('jpoker_position'), true, "seat 1 in position");
        equals($("#player_seat1" + id).hasClass('jpoker_sit_out'), false, "seat 1 sit");

        equals($("#player_seat2" + id).hasClass('jpoker_position'), false, "seat 2 not in position");
        equals($("#player_seat2" + id).hasClass('jpoker_sit_out'), false, "seat 2 sit");

        table.handler(server, game_id, { type: 'PacketPokerPosition', serial: 20, game_id: game_id });
	equals($("#player_seat1" + id).hasClass('jpoker_position'), false, "seat 1 not in position");
        equals($("#player_seat2" + id).hasClass('jpoker_position'), true, "seat 2 in position");
	
        start_and_cleanup();
    });

test("jpoker.plugins.table.timeout", function(){
        expect(23);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        var player_name = 'username';
        for(var i = 1; i <= 3; i++) {
            table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: i, serial: i * 10, game_id: game_id, name: player_name + i });
            table.serial2player[i * 10].sit = true;
        }

        place.jpoker('table', 'url', game_id);

        var seat;
        for(seat = 1; seat <= 3; seat++) {
            var c = "#player_seat" + seat + "_timeout" +  id;
            equals($(c).size(), 1, "seat timeout length " + seat);
	    equals($(c).hasClass("jpoker_timeout"), true, "seat jpoker_timeout class " + seat);
	    equals($(c).is(":hidden"), true, "seat timeout hidden");
        }
	equals($(".jpoker_timeout_progress", place).length, 3, "timeout_progress");

        table.handler(server, game_id, { type: 'PacketPokerPosition', serial: 10, game_id: game_id });
        equals($("#player_seat1_timeout" + id).is(":visible"), true, "seat 1 timeout visible");
        equals($("#player_seat1_timeout" + id).attr("pcur"), 100, "seat 1 timeout 100");
        equals($("#player_seat2_timeout" + id).is(":hidden"), true, "seat 2 timeout hidden");

        table.handler(server, game_id, { type: 'PacketPokerPosition', serial: 20, game_id: game_id });

        equals($("#player_seat1_timeout" + id).is(":hidden"), true, "seat 1 timeout hidden");
        equals($("#player_seat2_timeout" + id).is(":visible"), true, "seat 2 timeout visible");
        equals($("#player_seat2_timeout" + id).attr("pcur"), 100, "seat 2 timeout 100");

	var jquery_stop = jQuery.fn.stop;
	jQuery.fn.stop = function() {
	    ok(true, '$.stop called');
	    return this;
	};
        table.handler(server, game_id, { type: 'PacketPokerTimeoutWarning', serial: 20, game_id: game_id });
	jQuery.fn.stop = jquery_stop;

        equals($("#player_seat1_timeout" + id).is(":hidden"), true, "seat 1 timeout hidden");
        equals($("#player_seat2_timeout" + id).is(":visible"), true, "seat 2 timeout visible");
        equals($("#player_seat2_timeout" + id).attr("pcur"), 50, "seat 2 timeout 50");

        table.handler(server, game_id, { type: 'PacketPokerTimeoutNotice', serial: 20, game_id: game_id });

        equals($("#player_seat1_timeout" + id).is(":hidden"), true, "seat 1 timeout hidden");
        equals($("#player_seat2_timeout" + id).is(":visible"), true, "seat 2 timeout hidden");
        equals($("#player_seat2_timeout" + id).attr("pcur"), 0, "seat 2 timeout 0");
	
        start_and_cleanup();
    });

test("jpoker.plugins.table: PacketPokerPotChips/Reset", function(){
        expect(9);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        equals($("#pot0" + id).size(), 1, "pot0 DOM element");
        equals($("#pot0" + id).css('display'), 'none', "pot0 hidden");
        equals(table.pots[0], 0, "pot0 empty");
        var pot = [10, 3, 100, 8];
        var pot_value = jpoker.chips.chips2value(pot);
        equals(pot_value - 8.30 < jpoker.chips.epsilon, true, "pot_value");

        table.handler(server, game_id, { type: 'PacketPokerPotChips', bet: pot, index: 0, game_id: game_id });
        equals($("#pot0" + id).css('display'), 'block', "pot 0 set");
        equals($("#pot0" + id).attr('title'), pot_value, "pot 0 title");
        equals(table.pots[0], pot_value, "pot0 empty");

        table.handler(server, game_id, { type: 'PacketPokerChipsPotReset', game_id: game_id });
        equals($("#pot0" + id).css('display'), 'none', "pot0 hidden");
        equals(table.pots[0], 0, "pot0 empty");
        start_and_cleanup();
    });

test("jpoker.plugins.table: PacketSerial ", function(){
        expect(7);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 43;
        server.handler(server, 0, { type: 'PacketSerial', serial: player_serial});
        var packet = { type: 'PacketPokerBetLimit',
                       game_id: game_id,
                       min:   500,
                       max: 20000,
                       step:  100,
                       call: 1000,
                       allin:4000,
                       pot:  2000
        };
        table.handler(server, game_id, packet);
        var player_seat = 2;
        var player_name = 'username';
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', name: player_name, seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];
        table.handler(server, game_id, { type: 'PacketPokerSit', serial: player_serial, game_id: game_id });
        equals($("#player_seat" + player_seat + id).hasClass('jpoker_sit_out'), false, 'no class sitout');
        equals($("#fold" + id).is(':hidden'), true, 'fold interactor not visible');
        table.handler(server, game_id, { type: 'PacketPokerSelfInPosition', serial: player_serial, game_id: game_id });
        equals($("#fold" + id).is(':visible'), true, 'fold interactor visible');
        equals($("#jpokerSound " + jpoker.sound).attr("src").indexOf('hand') >= 0, true, 'sound in position');

        // table is destroyed and rebuilt from cached state
        server.handler(server, 0, { type: 'PacketSerial', serial: player_serial});
        equals(server.tables[game_id].id, table_packet.id);
        equals($("#player_seat" + player_seat + id).hasClass('jpoker_sit_out'), false, 'no class sitout');
        equals($("#fold" + id).is(':visible'), false, 'fold interactor visible');

        jpoker.plugins.playerSelf.hide(id);

        cleanup();
    });

test("jpoker.plugins.table: PacketPokerUserInfo", function(){
        expect(1);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
	var rebuy = jpoker.plugins.playerSelf.rebuy;
	jpoker.plugins.playerSelf.rebuy = function() {
	    jpoker.plugins.playerSelf.rebuy = rebuy;
	    ok(true, 'rebuy called');
	};
        server.handler(server, game_id, { 'type': 'PacketPokerUserInfo', 'game_id': game_id });
    });

test("jpoker.plugins.table: callback.tourney_end", function(){
        expect(6);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
	table.is_tourney = true;
	var tourney_serial = 42;
	table.tourney_serial = tourney_serial;
	   
        place.jpoker('table', 'url', game_id);
	equals(table.tourney_rank, undefined, 'tourney_rank undefined');
        table.handler(server, game_id, { 'type': 'PacketPokerTourneyRank', 'serial': tourney_serial, 'game_id': game_id, 'rank': 1, 'players': 10, 'money': 1000});
	equals(table.tourney_rank.rank, 1, 'tourney_rank.rank');
	equals(table.tourney_rank.players, 10, 'tourney_rank.players');
	equals(table.tourney_rank.money, 1000, 'tourney_rank.money');
	
	var jpoker_table_callback_tourney_end = jpoker.plugins.table.callback.tourney_end;
	jpoker.plugins.table.callback.tourney_end = function(table) {
	    jpoker.plugins.table.callback.tourney_end = jpoker_table_callback_tourney_end;
	    equals(table.tourney_serial, tourney_serial, 'callback tourney_end called');
	    equals($('#game_window' + id).length, 0, 'game window removed');
	};
	table.handler(server, game_id, { 'type': 'PacketPokerTableDestroy', 'game_id': game_id });
    });

test("jpoker.plugins.table: callback.tourney_end default", function(){
        expect(2);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
	table.is_tourney = true;
	var tourney_serial = 42;
	table.tourney_serial = tourney_serial;
	   
        place.jpoker('table', 'url', game_id);
        table.handler(server, game_id, { 'type': 'PacketPokerTourneyRank', 'serial': tourney_serial, 'game_id': game_id, 'rank': 1, 'players': 10, 'money': 1000});
	server.tourneyRowClick = function(server, packet) {
	    equals(packet.name, '');
	    equals(packet.game_id, tourney_serial);
	};
	table.handler(server, game_id, { 'type': 'PacketPokerTableDestroy', 'game_id': game_id });
    });

test("jpoker.plugins.table: remove callbacks", function(){
        expect(4);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

	table.callbacks.update = [];
        place.jpoker('table', 'url', game_id);
	equals(table.callbacks.update.length, 1, 'table updateCallback registered');
	equals(table.callbacks.reinit.length, 1, 'table reinitCallback registered');
	$("#" + id).remove();
	table.notifyUpdate({type: 'PacketPing'});
	equals(table.callbacks.update.length, 0, 'table updateCallback removed');
	table.notifyReinit({type: 'PacketPing'});
	equals(table.callbacks.reinit.length, 0, 'table reinitCallback removed');
    });

test("jpoker.plugins.table: powered_by", function(){
        expect(4);
	var packet = {"type": "PacketPokerTable", "id": 100, "name": "One", "percent_flop" : 98, "betting_structure": "15-30-no-limit"};
        var server = jpoker.serverCreate({ url: 'url' });
	server.tables[packet.id] = new jpoker.table(server, packet);
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

        var game_id = 100;

        place.jpoker('table', 'url', game_id);

	var powered_by_element = $('#powered_by'+id);
	equals(powered_by_element.length, 1, 'table info');
	ok(powered_by_element.hasClass('jpoker_powered_by'), 'jpoker_powered_by class');
	equals($('a', powered_by_element).length, 1, 'a');
	equals($('a span', powered_by_element).length, 1, 'span');
	cleanup();
    });

test("jpoker.plugins.table: display done callback", function(){
        expect(1);

        var server = jpoker.serverCreate({ url: 'url' });
        var player_serial = 1;
        server.serial = player_serial; // pretend logged in
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

	var display_done = jpoker.plugins.table.callback.display_done;
	jpoker.plugins.table.callback.display_done = function(element) {
	    jpoker.plugins.table.callback.display_done = display_done;
	    equals($(".jpoker_chat_input", element).length, 1);
	};
        place.jpoker('table', 'url', game_id);
        cleanup(id);
    });

//
// player
//
test("jpoker.plugins.player: PacketPokerPlayerArrive", function(){
        expect(6);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 1;
        server.serial = player_serial;
        var player_seat = 2;
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];
        equals(player.serial, player_serial, "player_serial");

        var avatar = $("#player_seat2_avatar" + id);
        equals(avatar.hasClass('jpoker_avatar_default_3'), true, 'default avatar 3');
	ok($('#player_seat2' + id).hasClass('jpoker_player_seat'), 'jpoker_seat');
	ok($('#player_seat2' + id).hasClass('jpoker_player_seat2'), 'jpoker_seat2');
	ok($('#seat2' + id).hasClass('jpoker_seat'), 'jpoker_seat');
	ok($('#seat2' + id).hasClass('jpoker_seat2'), 'jpoker_seat2');
        
        start_and_cleanup();
    });

test("jpoker.plugins.player: avatar", function(){
        expect(1);
        stop();

        var server = jpoker.serverCreate({ url: 'url', urls : {avatar : 'http://avatar-server/'}});
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 1;
        server.serial = player_serial;
        var player_seat = 2;
	var send_auto_muck = jpoker.plugins.muck.sendAutoMuck;
	jpoker.plugins.muck.sendAutoMuck = function() {};
	server.ajax = function(options) {
	    options.success('data', 'status');
	};
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
	ok($("#player_seat2_avatar" + id + " img").attr("src").indexOf('/1') >= 0, 'avatar');
	jpoker.plugins.muck.sendAutoMuck = send_auto_muck;
        start_and_cleanup();
    });

test("jpoker.plugins.player: avatar race condition", function(){
        expect(3);
        stop();

        var server = jpoker.serverCreate({ url: 'url', urls : {avatar : 'http://avatar-server/'}});
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 1;
        server.serial = player_serial;
        var player_seat = 2;
	var send_auto_muck = jpoker.plugins.muck.sendAutoMuck;
	jpoker.plugins.muck.sendAutoMuck = function() {};
	var ajax_success = [];
	server.ajax = function(options) {
	    ajax_success.push(options.success);
	};
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', name: "player1", seat: player_seat, serial: player_serial, game_id: game_id });
        var player2_name = "player2";
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', name: player2_name, seat: player_seat+1, serial: player_serial+1, game_id: game_id });

	ajax_success[0]('data', 'status');
	ajax_success[1]('data', 'status');
	ok($("#player_seat2_avatar" + id + " img").attr("src").indexOf('/1') >= 0, 'avatar');
	ok($("#player_seat3_avatar" + id + " img").attr('src').indexOf('/2') >= 0, 'avatar 2');
	equals($("#player_seat3_avatar" + id + " img").attr('alt'), player2_name, 'avatar 2 alt');

	jpoker.plugins.muck.sendAutoMuck = send_auto_muck;
        start_and_cleanup();
    });

test("jpoker.plugins.player: avatar hover", function(){
        expect(4);
        stop();

        var server = jpoker.serverCreate({ url: 'url', urls : {avatar : 'http://avatar-server/'}});
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 1;
        server.serial = player_serial;
        var player_seat = 2;
	var send_auto_muck = jpoker.plugins.muck.sendAutoMuck;
	jpoker.plugins.muck.sendAutoMuck = function() {};
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
	var avatar_hover_enter = jpoker.plugins.player.callback.avatar_hover_enter;
	jpoker.plugins.player.callback.avatar_hover_enter = function(player, jpoker_id) {
	    equals(player.serial, player_serial, 'avatar hover enter serial');
	    equals(jpoker_id, id, 'avatar hover enter id');
	};
	$("#player_seat2_avatar" + id).trigger('mouseenter');
	jpoker.plugins.player.callback.avatar_hover_enter = avatar_hover_enter;
	var avatar_hover_leave = jpoker.plugins.player.callback.avatar_hover_leave;
	jpoker.plugins.player.callback.avatar_hover_leave = function(player, jpoker_id) {
	    equals(player.serial, player_serial, 'avatar hover leave serial');
	    equals(jpoker_id, id, 'avatar hover leave id');
	};
	$("#player_seat2_avatar" + id).trigger('mouseleave');
	jpoker.plugins.player.callback.avatar_hover_leave = avatar_hover_leave;
	jpoker.plugins.muck.sendAutoMuck = send_auto_muck;
        start_and_cleanup();
    });

test("jpoker.plugins.player: avatar hover default", function(){	
	expect(2);
        stop();

        var server = jpoker.serverCreate({ url: 'url', urls : {avatar : 'http://avatar-server/'}});
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 1;
        server.serial = player_serial;
        var player_seat = 2;
	var send_auto_muck = jpoker.plugins.muck.sendAutoMuck;
	jpoker.plugins.muck.sendAutoMuck = function() {};
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
	var player = server.tables[game_id].serial2player[player_serial];

	var avatar_element = $('#player_seat2_avatar'+id);
	jpoker.plugins.player.callback.avatar_hover_enter(player, id);
	equals(avatar_element.hasClass('jpoker_avatar_hover'), true, 'jpoker_avatar_hover');
	jpoker.plugins.player.callback.avatar_hover_leave(player, id);
	equals(avatar_element.hasClass('jpoker_avatar_hover'), false, 'no jpoker_avatar_hover');

	jpoker.plugins.muck.sendAutoMuck = send_auto_muck;
	start_and_cleanup();
    });

test("jpoker.plugins.player: rank and level", function(){
        expect(13);
        stop();

        var server = jpoker.serverCreate({ url: 'url', urls : {avatar : 'http://avatar-server/'}});
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 1;
        server.serial = player_serial;
        var player_seat = 2;
	var send_auto_muck = jpoker.plugins.muck.sendAutoMuck;
	jpoker.plugins.muck.sendAutoMuck = function() {
	    jpoker.plugins.muck.sendAutoMuck = send_auto_muck;
	};
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
	var player = table.serial2player[player_serial];
	var element = $("#player_seat2_stats"+id);
	var seat_element = $("#player_seat2"+id);
	ok(element.hasClass('jpoker_player_stats'), 'player stats seat class');
	ok(element.hasClass('jpoker_ptable_player_seat2_stats'), 'player stats seat class');
	server.handler(server, 0, {type: 'PacketPokerPlayerStats', serial: player_serial, rank: 1, percentile: 0});
	equals($('.jpoker_player_rank', element).length, 1, 'player rank');
	equals($('.jpoker_player_level', element).length, 1, 'player level');	
	equals($('.jpoker_player_rank', element).html(), 1, 'player rank 100');
	ok($('.jpoker_player_level', element).hasClass('jpoker_player_level_junior'), 'player level junior');
	ok(seat_element.hasClass('jpoker_player_level_junior'), 'player level junior');
	server.handler(server, 0, {type: 'PacketPokerPlayerStats', serial: player_serial, rank: 1, percentile: 25});
	ok($('.jpoker_player_level', element).hasClass('jpoker_player_level_pro'), 'player level pro');
	ok(seat_element.hasClass('jpoker_player_level_pro'), 'player level pro');
	server.handler(server, 0, {type: 'PacketPokerPlayerStats', serial: player_serial, rank: 1, percentile: 50});
	ok($('.jpoker_player_level', element).hasClass('jpoker_player_level_expert'), 'player level expert');
	ok(seat_element.hasClass('jpoker_player_level_expert'), 'player level expert');
	server.handler(server, 0, {type: 'PacketPokerPlayerStats', serial: player_serial, rank: 1, percentile: 75});
	ok($('.jpoker_player_level', element).hasClass('jpoker_player_level_master'), 'player level master');
	ok(seat_element.hasClass('jpoker_player_level_master'), 'player level master');
	start_and_cleanup();
     });

test("jpoker.plugins.player: rejoin", function(){
	expect(6);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);

        var player_name = 'username';
	table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: 1, serial: 11, game_id: game_id, name: player_name});
	equals($(".jpoker_timeout_progress", place).length, 1, 'timeout_progress added');
	equals($(".jpoker_player_stats", place).length, 1, 'player_stats added');
	equals($(".jpoker_player_sidepot", place).length, 1, 'player_sidepot added');
	table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: 1, serial: 12, game_id: game_id, name: player_name});
	equals($(".jpoker_timeout_progress", place).length, 1, 'timeout_progress x1');
	equals($(".jpoker_player_stats", place).length, 1, 'player_stats x1');
	equals($(".jpoker_player_sidepot", place).length, 1, 'player_sidepot x1');
    });

test("jpoker.plugins.player: PacketPokerPlayerCards", function(){
        expect(8);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 1;
        var player_seat = 2;
        server.tables[game_id].handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];
        equals(player.serial, player_serial, "player_serial");

        var card = $("#card_seat" + player_seat + "0" + id);
        var card_value = 1;
        equals(card.size(), 1, "seat 2, card 0 DOM element");
        equals(card.css('display'), 'none', "seat 2, card 0 hidden");
        equals(player.cards[0], null, "player card empty");
        table.handler(server, game_id, { type: 'PacketPokerPlayerCards', cards: [card_value], serial: player_serial, game_id: game_id });
        equals(card.hasClass('jpoker_card_3h'), true, 'card_3h class');
        equals(player.cards[0], card_value, "card in slot 0");
	equals(card.is(':visible'), true, 'card visible');

	table.handler(server, game_id, { type: 'PacketPokerFold', serial: player_serial, game_id: game_id });
	equals(card.is(':hidden'), true, 'card hidden');
        
        start_and_cleanup();
    });

test("jpoker.plugins.player: PacketPokerPlayerCall/Fold/Raise/Check/Start", function(){
        expect(7);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 1;
        var player_seat = 2;
        server.tables[game_id].handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];
	var player_action_element = $('#player_seat'+player.seat+'_action'+id);
	equals(player_action_element.length, 1, 'player action');
	equals(player_action_element.hasClass('jpoker_action'), true, 'player action class');

        table.handler(server, game_id, { type: 'PacketPokerCall', serial: player_serial, game_id: game_id });
	equals(player_action_element.html(), 'call');

	table.handler(server, game_id, { type: 'PacketPokerFold', serial: player_serial, game_id: game_id });
	equals(player_action_element.html(), 'fold');

	table.handler(server, game_id, { type: 'PacketPokerRaise', serial: player_serial, game_id: game_id });
	equals(player_action_element.html(), 'raise');

	table.handler(server, game_id, { type: 'PacketPokerCheck', serial: player_serial, game_id: game_id });
	equals(player_action_element.html(), 'check');

	table.handler(server, game_id, { type: 'PacketPokerStart', serial: 0, game_id: game_id });
	equals(player_action_element.html(), '');
        
        start_and_cleanup();
    });

test("jpoker.plugins.player: PacketPokerPlayerChips", function(){
        expect(15);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 1;
        server.serial = player_serial;
        var player_seat = 2;
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];
        equals(player.serial, player_serial, "player_serial");

        var slots = [ 'bet', 'money' ];
        for(var i = 0; i < slots.length; i++) {
            var chips = $("#player_seat" + player_seat + "_" + slots[i] + id);
            equals(chips.size(), 1, slots[i] + " DOM element");
            equals(chips.css('display'), 'none', slots[i] + " chips hidden");
            equals(player[slots[i]], 0, slots[i] + " chips");
            equals(player.state, 'buyin');
            var packet = { type: 'PacketPokerPlayerChips',
                           money: 0,
                           bet: 0,
                           serial: player_serial,
                           game_id: game_id };
            var amount = 101;
            packet[slots[i]] = amount;
            table.handler(server, game_id, packet);
            if(slots[i] == 'bet') {
                equals(player.state, 'buyin');
            } else {
                equals(player.state, 'playing');
            }
            equals(chips.css('display'), 'block', slots[i] + " chips visible");
            equals(chips.html().indexOf(amount / 100) >= 0, true, amount / 100 + " in html ");
        }
        
        start_and_cleanup();
    });

test("jpoker.plugins.player: PokerSeat", function(){
        expect(6);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 43;
        server.handler(server, 0, { type: 'PacketSerial', serial: player_serial});
        equals($("#sit_seat0" + id).css('display'), 'block', "sit_seat0 visible");
        var sent = false;
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerSeat');
            equals(packet.serial, player_serial);
            equals(packet.game_id, game_id);
            equals(packet.seat, 0);
            sent = true;
        };
        $("#sit_seat0" + id).click();
        equals(sent, true, "packet sent");
        cleanup(id);
    });

test("jpoker.plugins.player: PokerSit/SitOut", function(){
        expect(16);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 43;
        equals($("#rebuy" + id).css('display'), 'none', "rebuy is not visible");
        server.handler(server, 0, { type: 'PacketSerial', serial: player_serial});
        var player_seat = 2;
        var player_name = 'username';
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', name: player_name, seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];
        player.money = 100;
        //
        // sit
        //
        var sit = $("#player_seat2_name" + id);
        equals($("#rebuy" + id).css('display'), 'block', "rebuy is visible");
        equals(sit.html(), 'click to sit', 'click to sit (A)');
        var sent = false;
        server.sendPacket = function(packet) {
            if(packet.type == 'PacketPokerAutoBlindAnte') {
                return;
            }
            equals(packet.type, 'PacketPokerSit');
            equals(packet.game_id, game_id);
            equals(packet.serial, player_serial);
            sent = true;
        };
        sit.click();
        equals(sent, true, "packet sent");

        table.handler(server, game_id, { type: 'PacketPokerSit', serial: player_serial, game_id: game_id });
        equals($("#player_seat2" + id).hasClass('jpoker_sit_out'), false, 'no class sitout');
        equals(sit.html(), player_name);

        //
        // sit out
        //
        sent = false;
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerSitOut');
            equals(packet.game_id, game_id);
            equals(packet.serial, player_serial);
            sent = true;
        };
        sit.click();

        table.handler(server, game_id, { type: 'PacketPokerSitOut', serial: player_serial, game_id: game_id });
        equals($("#player_seat2" + id).hasClass('jpoker_sit_out'), true, 'class sitout');
        equals(sit.html(), 'click to sit');

        //
        // sit when broke
        //
        player.money = 0;
        var called = false;
        dialog = jpoker.dialog;
        jpoker.dialog = function(message) {
            equals(message.indexOf('not enough') >= 0, true, message);
            called = true;
        };
        server.sendPacket = function() {};
        sit.click();
        jpoker.dialog = dialog;
        equals(called, true, "alert because broke");

        cleanup(id);
    });


test("jpoker.plugins.player: PokerSit/SitOut PacketPokerAutoFold", function(){
        expect(2);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 43;
        server.handler(server, 0, { type: 'PacketSerial', serial: player_serial});
        var player_seat = 2;
        var player_name = 'username';
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', name: player_name, seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];
        player.money = 100;
        //
        // sit
        //
        var sit = $("#player_seat2_name" + id);
        sit.click();
        table.handler(server, game_id, { type: 'PacketPokerSit', serial: player_serial, game_id: game_id });

        //
        // sit out
        //
        sit.click();
        table.handler(server, game_id, { type: 'PacketPokerAutoFold', serial: player_serial, game_id: game_id });
        equals($("#player_seat2" + id).hasClass('jpoker_sit_out'), true, 'class sitout');
        equals(sit.html(), 'click to sit');

        cleanup(id);
    });

test("jpoker.plugins.player: side_pot", function(){
        expect(8);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 43;
        server.handler(server, 0, { type: 'PacketSerial', serial: player_serial});
        var player_seat = 2;
        var player_name = 'username';
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', name: player_name, seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];
        player.money = 100;
	player.sit = true;
	var side_pot = $('#player_seat2_sidepot' + id);
	equals(side_pot.length, 1, 'side pot element');
	ok(side_pot.hasClass('jpoker_player_sidepot'), 'side pot class');
	ok(side_pot.hasClass('jpoker_ptable_player_seat2_sidepot'), 'side pot seat class');
	ok(side_pot.is(':hidden'), 'side pot hidden');

	player.money = 0;
	table.handler(server, game_id, { type: 'PacketPokerPotChips', game_id: game_id, index: 1, bet: [1,100000] });
	equals(side_pot.html(), 'Pot 1: 1000');
	ok(side_pot.is(':visible'), 'side pot visible');
	table.handler(server, game_id, { type: 'PacketPokerChipsPotReset', game_id: game_id });
	equals(side_pot.html(),  '');
	ok(side_pot.is(':hidden'), 'side pot hidden');
        cleanup(id);
    });

test("jpoker.plugins.player: PacketPokerStart", function(){
        expect(2);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 43;
        server.handler(server, 0, { type: 'PacketSerial', serial: player_serial});
        var player_seat = 2;
        var player_name = 'username';
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', name: player_name, seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];
        player.money = 100;

	player.handler = function(server, game_id, packet) {
	    equals(packet.serial, undefined, 'packet serial undefined');
	};
	table.handler(server, game_id, { type: 'PacketPokerStart', game_id: game_id });	
	var card = $("#card_seat" + player_seat + "0" + id);
	equals(card.is(':hidden'), true, 'card hidden');
	start_and_cleanup();
    });

test("jpoker.plugins.player: player callback", function(){
        expect(3);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];

        place.jpoker('table', 'url', game_id);
        var player_serial = 43;
        server.handler(server, 0, { type: 'PacketSerial', serial: player_serial});
        var player_seat = 2;
        var player_name = 'username';
	var jpoker_player_callback_player_arrive = jpoker.plugins.player.callback.player_arrive;
	jpoker.plugins.player.callback.player_arrive = function(element, serial) {
	    equals(serial, player_serial, 'player serial');
	    equals(element.length, undefined, 'not a jquery selector');
	    equals($('.jpoker_name', element).length, 1, 'player element');
	    jpoker.plugins.player.callback.player_arrive = jpoker_player_callback_player_arrive;
	    start_and_cleanup();
	};
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', name: player_name, seat: player_seat, serial: player_serial, game_id: game_id });
    });

function _SelfPlayer(game_id, player_serial) {
    var server = jpoker.serverCreate({ url: 'url' });
    var place = $("#main");

    var currency_serial = 42;
    var table_packet = { id: game_id, currency_serial: currency_serial };
    server.tables[game_id] = new jpoker.table(server, table_packet);    

    // table
    place.jpoker('table', 'url', game_id);
    // player
    server.serial = player_serial;
    var player_seat = 2;
    server.tables[game_id].handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
    var player = server.tables[game_id].serial2player[player_serial];
    equals(player.serial, player_serial, "player_serial");
    // player money
    var money = 500;
    var in_game = 44;
    var points = 45;
    var currency_key = 'X' + currency_serial;
    server.userInfo = { money: {} };
    server.userInfo.money[currency_key] = [ money * 100, in_game * 100, points ];
}

function _SelfPlayerSit(game_id, player_serial, money) {
    _SelfPlayer(game_id, player_serial);
    // buy in
    var Z = jpoker.getServerTablePlayer('url', game_id, player_serial);
    var packet = { type: 'PacketPokerPlayerChips',
                   money: money * 100,
                   bet: 0,
                   serial: player_serial,
                   game_id: game_id };
    Z.table.handler(Z.server, game_id, packet);
    equals(Z.player.money, money, 'player money');
    // sit
    Z.table.handler(Z.server, game_id, { type: 'PacketPokerSit', serial: player_serial, game_id: game_id });
    equals(Z.player.sit, true, 'player is sit');
}

test("jpoker.plugins.player: PacketPokerSelfInPosition/LostPosition", function(){
        expect(90);

        var id = 'jpoker' + jpoker.serial;
        var player_serial = 1;
        var game_id = 100;
        var money = 1000;
        _SelfPlayerSit(game_id, player_serial, money);

        var Z = jpoker.getServerTablePlayer('url', game_id, player_serial);

        var visibility = function(selector, ids, comment) {
            for(var i = 0; i < ids.length; i++) {
                equals($('#' + ids[i] + id).is(selector), true, ids[i] + ' ' + selector + ' ' + comment);
            }
        };

        var interactors = function(active, passive, comment) {
            var i;
            var all = active.concat(passive);
            visibility(':hidden', all, '(1) ' + comment);
            Z.table.handler(Z.server, game_id, { type: 'PacketPokerSelfInPosition', serial: player_serial, game_id: game_id });
            visibility(':visible', active, '(2) ' + comment);
            visibility(':hidden', passive, '(3) ' + comment);

            var click = function(id, suffix) {
                var sent = false;
                sendPacket = Z.server.sendPacket;
                Z.server.sendPacket = function(packet) {
                    equals(packet.type, 'PacketPoker' + suffix, suffix + ' ' + comment);
                    equals(packet.game_id, game_id, 'game_id for ' + suffix + ' ' + comment);
                    equals(packet.serial, player_serial, 'serial for ' + suffix + ' ' + comment);
                    sent = true;
                };
                $(id).click();
                Z.server.sendPacket = sendPacket;
                equals(sent, true, suffix + ' packet sent ' + comment);
            };
            var keys = {
                'fold': 'Fold',
                'call': 'Call', 
                'raise': 'Raise',
                'check': 'Check'
            };
            for(i = 0; i < active.length; i++) {
                click('#' + active[i] + id, keys[active[i]]);
            }

            Z.table.handler(Z.server, game_id, { type: 'PacketPokerSelfLostPosition', serial: 333, game_id: game_id });
            visibility(':hidden', all, '(4) ' + comment);
        };

        Z.table.betLimit = {
            min:   5,
            max:   10,
            step:  1,
            call: 10,
            allin:40,
            pot:  20
        };
        interactors([ 'fold', 'call', 'raise' ], [ 'check' ], 'no check');

        Z.table.betLimit = {
            min:   10,
            max:   10,
            step:  1,
            call: 10,
            allin:40,
            pot:  20
        };
        interactors([ 'fold', 'call', 'raise' ], [ 'check' ], 'limit');

        Z.table.betLimit = {
            min:   5,
            max:   10,
            step:  1,
            call:  0,
            allin:40,
            pot:  20
        };
        interactors([ 'fold', 'check', 'raise' ], [ 'call' ], 'can check');

        Z.table.handler(Z.server, game_id, { type: 'PacketPokerSelfInPosition', serial: player_serial, game_id: game_id });
        var raise = $('#raise_range' + id);
	equals($(".jpoker_raise_label", raise).html(), 'raise', 'raise label');
        equals($(".jpoker_raise_min", raise).html(), Z.table.betLimit.min, 'min');
        equals($(".jpoker_raise_current", raise).html(), Z.table.betLimit.min, 'current');
        equals($(".jpoker_raise_max", raise).html(), Z.table.betLimit.max, 'max');
        equals(raise.is(':visible'), true, 'raise range visible');
	var raise_input = $('#raise_input' + id);
	equals(raise_input.is(':visible'), true, 'raise input visible');
	equals($('.jpoker_raise_input', raise_input).length, 1, 'raise input');
        var slider = $('.ui-slider-1', raise);
	equals($('.jpoker_raise_current', raise).attr("title"), 5, "title = raise amount");
	equals($('.jpoker_raise_input', raise_input).val(), 5, 'raise input value = raise amount');
	slider.slider("moveTo", 6, 0);
	equals(slider.slider("value", 0), 6, "slider value updated");
	equals($('.jpoker_raise_current', raise).attr("title"), 6, "title updated by slider");
	equals($('.jpoker_raise_input', raise_input).val(), 6, 'raise input updated by slider');
	$('.jpoker_raise_input', raise_input).val(7).change();
	equals($('.jpoker_raise_current', raise).attr("title"), 7, "title updated by input");
        //        $('.ui-slider-handle', raise).parent().triggerKeydown("38");
        // equals($(".jpokerRaiseCurrent", raise).attr('title'), Z.table.betLimit.min, 'value changed');
        Z.table.handler(Z.server, game_id, { type: 'PacketPokerSelfLostPosition', serial: 333, game_id: game_id });
	equals(raise.is(':hidden'), true, 'raise range hidden');
	equals($('#raise_input' + id).is(':hidden'), true, 'raise input hidden');

        cleanup(id);
    });

test("jpoker.plugins.player: hover button", function(){
	expect(33);
        var id = 'jpoker' + jpoker.serial;
        var player_serial = 1;
        var game_id = 100;
        var money = 1000;
        _SelfPlayerSit(game_id, player_serial, money);	
	var element = $('#fold' + id);
	equals(element.length, 1, 'element');
	element.trigger('mouseenter');
	equals(element.hasClass('hover'), true, 'hasClass hover');
	element.trigger('mouseleave');
	equals(element.hasClass('hover'), false, '!hasClass hover');
	element = $('#check' + id);
	equals(element.length, 1, 'element');
	element.trigger('mouseenter');
	equals(element.hasClass('hover'), true, 'hasClass hover');
	element.trigger('mouseleave');
	equals(element.hasClass('hover'), false, '!hasClass hover');
	element = $('#call' + id);
	equals(element.length, 1, 'element');
	element.trigger('mouseenter');
	equals(element.hasClass('hover'), true, 'hasClass hover');
	element.trigger('mouseleave');
	equals(element.hasClass('hover'), false, '!hasClass hover');
	element = $('#raise' + id);
	equals(element.length, 1, 'element');
	element.trigger('mouseenter');
	equals(element.hasClass('hover'), true, 'hasClass hover');
	element.trigger('mouseleave');
	equals(element.hasClass('hover'), false, '!hasClass hover');
	element = $('#rebuy' + id);
	equals(element.length, 1, 'element');
	element.trigger('mouseenter');
	equals(element.hasClass('hover'), true, 'hasClass hover');
	element.trigger('mouseleave');
	equals(element.hasClass('hover'), false, '!hasClass hover');
	element = $('#sitout' + id);
	equals(element.length, 1, 'element');
	element.trigger('mouseenter');
	equals(element.hasClass('hover'), true, 'hasClass hover');
	element.trigger('mouseleave');
	equals(element.hasClass('hover'), false, '!hasClass hover');
	element = $('#sitin' + id);
	equals(element.length, 1, 'element');
	element.trigger('mouseenter');
	equals(element.hasClass('hover'), true, 'hasClass hover');
	element.trigger('mouseleave');
	equals(element.hasClass('hover'), false, '!hasClass hover');
	element = $('#muck_accept' + id);
	equals(element.length, 1, 'element');
	element.trigger('mouseenter');
	equals(element.hasClass('hover'), true, 'hasClass hover');
	element.trigger('mouseleave');
	equals(element.hasClass('hover'), false, '!hasClass hover');
	element = $('#muck_deny' + id);
	equals(element.length, 1, 'element');
	element.trigger('mouseenter');
	equals(element.hasClass('hover'), true, 'hasClass hover');
	element.trigger('mouseleave');
	equals(element.hasClass('hover'), false, '!hasClass hover');
	element = $('#quit' + id);
	equals(element.length, 1, 'element');
	element.trigger('mouseenter');
	equals(element.hasClass('hover'), true, 'hasClass hover');
	element.trigger('mouseleave');
	equals(element.hasClass('hover'), false, '!hasClass hover');
    });

test("jpoker.plugins.player: text button", function(){
	expect(5);
        var id = 'jpoker' + jpoker.serial;
        var player_serial = 1;
        var game_id = 100;
        var money = 1000;
        _SelfPlayerSit(game_id, player_serial, money);	
	var element = $('#quit' + id);	
	equals($('div a', element).html(), 'Exit', 'exit label');
	element = $('#rebuy' + id);
	equals($('div a', element).html(), 'Rebuy', 'rebuy label');
    });

test("jpoker.plugins.player: rebuy", function(){
        expect(19);

        var id = 'jpoker' + jpoker.serial;
        var player_serial = 1;
        var game_id = 100;
        _SelfPlayer(game_id, player_serial);
        var server = jpoker.getServer('url');
        var player = jpoker.getPlayer('url', game_id, player_serial);
	var table = jpoker.getTable('url', game_id);

        // buy in
        var min = 10;
        var best = 50;
        var max = 100;
        var rebuy_min = 4;
        table.handler(server, game_id, { type: 'PacketPokerBuyInLimits', game_id: game_id, min: min * 100, max: max * 100, best: best * 100, rebuy_min: rebuy_min });
        equals(table.buyInLimits()[0], min, 'buy in min 2');

        // rebuy error
        equals(jpoker.plugins.playerSelf.rebuy('url', game_id, 33333), false, 'rebuy for player that is not sit');

        // buyin
        $("#rebuy" + id).click();
        var rebuy = $("#jpokerRebuy");
        equals(rebuy.size(), 1, "rebuy dialog DOM element");
        equals(rebuy.parents().is(':visible'), true, 'dialog visible');
        equals($(".jpoker_rebuy_min", rebuy).html(), min, 'min');
        equals($(".jpoker_rebuy_current", rebuy).html(), best, 'best');
        equals($(".jpoker_rebuy_max", rebuy).html(), max, 'max');
        
        var sent;
        sent = false;
        sendPacket = server.sendPacket;
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerBuyIn');
            sent = true;
        };
        $("button", rebuy).click();
        server.sendPacket = sendPacket;
        equals(sent, true, 'BuyIn packet sent');
        equals(rebuy.parents().is(':hidden'), true, 'dialog hidden');


        // rebuy
        player.state = 'playing';
        $("#rebuy" + id).click();
        equals(rebuy.parents().is(':visible'), true, 'dialog visible');

        // value change
        var slider = $('.ui-slider-1', rebuy);
        $('.ui-slider-handle').css('width', 1); // there is no graphics, size is undefined
        slider.slider("moveTo", "+=" + min);
        equals($(".jpoker_rebuy_current", rebuy).html(), min, 'value changed');
        slider.slider("moveTo", "+=10");
        equals($(".jpoker_rebuy_current", rebuy).html(), min + 10, 'value changed');
        $('.ui-slider-handle', slider).parent().triggerKeydown("37");
        equals($(".jpoker_rebuy_current", rebuy).html(), min + 9, 'value changed');
        $('.ui-slider-handle', slider).parent().triggerKeydown("37");
        equals($(".jpoker_rebuy_current", rebuy).html(), min + 8, 'value changed');

        // click
        sent = false;
        sendPacket = server.sendPacket;
        server.sendPacket = function(packet) {
            equals(packet.type, 'PacketPokerRebuy');
            sent = true;
        };
        $("button", rebuy).click();
        server.sendPacket = sendPacket;
        equals(sent, true, 'Rebuy packet sent');
        equals(rebuy.parents().is(':hidden'), true, 'dialog hidden');

        cleanup(id);
    });

test("jpoker.plugins.player: rebuy if not enough money", function() {
	expect(2);

        var id = 'jpoker' + jpoker.serial;
	var server = jpoker.serverCreate({ url: 'url' });
	var place = $("#main");
	var game_id = 100;
	var currency_serial = 42;
	var player_serial = 12;
	var player_seat = 2;
	
	var table_packet = { id: game_id, currency_serial: currency_serial };
	server.tables[game_id] = new jpoker.table(server, table_packet);    
	server.tables[game_id].buyIn.min = 1000;
	server.tables[game_id].buyIn.bankroll = 1000;
	
	place.jpoker('table', 'url', game_id);
	// player
	server.serial = player_serial;
	server.tables[game_id].handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
	var rebuy = $("#rebuy"+id);

	rebuy.click(function() {
		ok(true, 'rebuy clicked');
	    });
	server.tables[game_id].handler(server, game_id, { type: 'PacketPokerPlayerChips',
		    money: 0,
		    bet: 0,
		    serial: player_serial,
		    game_id: game_id });
	equals(rebuy.is(':visible'), true, 'rebuy shown');	
	cleanup();
    });

test("jpoker.plugins.player: no rebuy in tourney", function() {
	expect(1);

        var id = 'jpoker' + jpoker.serial;
	var server = jpoker.serverCreate({ url: 'url' });
	var place = $("#main");
	var game_id = 100;
	var currency_serial = 42;
	var player_serial = 12;
	var player_seat = 2;
	
	var table_packet = { id: game_id, currency_serial: currency_serial };
	server.tables[game_id] = new jpoker.table(server, table_packet);    
	server.tables[game_id].buyIn.min = 1000;
	server.tables[game_id].buyIn.bankroll = 1000;
	server.tables[game_id].is_tourney = true;
	
	place.jpoker('table', 'url', game_id);
	// player
	server.serial = player_serial;
	server.tables[game_id].handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
	var rebuy = $("#rebuy"+id);

	rebuy.click(function() {
		ok(false, 'rebuy should not be clicked');
	    });
	server.tables[game_id].handler(server, game_id, { type: 'PacketPokerPlayerChips',
		    money: 0,
		    bet: 0,
		    serial: player_serial,
		    game_id: game_id });	
	equals(rebuy.is(':hidden'), true, 'rebuy hidden');
	cleanup();
    });

test("jpoker.plugins.player: no rebuy if money", function() {
	expect(1);

        var id = 'jpoker' + jpoker.serial;
	var server = jpoker.serverCreate({ url: 'url' });
	var place = $("#main");
	var game_id = 100;
	var currency_serial = 42;
	var player_serial = 12;
	var player_seat = 2;
	
	var table_packet = { id: game_id, currency_serial: currency_serial };
	server.tables[game_id] = new jpoker.table(server, table_packet);    
	server.tables[game_id].buyIn.min = 1000;
	server.tables[game_id].buyIn.bankroll = 1000;
	server.tables[game_id].is_tourney = false;
	
	place.jpoker('table', 'url', game_id);
	// player
	server.serial = player_serial;
	server.tables[game_id].handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
	var rebuy = $("#rebuy"+id);

	rebuy.click(function() {
		ok(false, 'rebuy should not be clicked');
	    });
	server.tables[game_id].handler(server, game_id, { type: 'PacketPokerPlayerChips',
		    money: 100,
		    bet: 0,
		    serial: player_serial,
		    game_id: game_id });
	equals(rebuy.is(':visible'), true, 'rebuy visible');
	cleanup();
    });


test("jpoker.plugins.userInfo", function(){
        expect(22);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

	server.serial = 42;
	var PERSONAL_INFO_PACKET = {'rating': 1000, 'firstname': 'John', 'money': {}, 'addr_street': '8', 'phone': '000-00000', 'cookie': '', 'serial': server.serial, 'password': '', 'addr_country': 'Yours', 'name': 'testuser', 'gender': 'Male', 'birthdate': '01/01/1970', 'addr_street2': 'Main street', 'addr_zip': '5000', 'affiliate': 0, 'lastname': 'Doe', 'addr_town': 'GhostTown', 'addr_state': 'Alabama', 'type': 'PacketPokerPersonalInfo', 'email': 'john@doe.com'};

        var PokerServer = function() {};
        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(PERSONAL_INFO_PACKET) + " ]",

            handle: function(packet) { }
        };
        ActiveXObject.prototype.server = new PokerServer();

        var id = 'jpoker' + jpoker.serial;
        var place = $('#main');

        equals('update' in server.callbacks, false, 'no update registered');
        place.jpoker('userInfo', 'url');
        equals(server.callbacks.update.length, 1, 'userInfo update registered');
	equals($('.jpoker_user_info').length, 1, 'user info div');
	server.registerUpdate(function(server, what, data) {
		var element = $('#' + id);
		if(element.length > 0) {
		    if (data.type == 'PacketPokerPersonalInfo') {
			equals($('.jpoker_user_info_name', element).text(), 'testuser');
			equals($('input[name=password]', element).val(), '');
			equals($('input[name=password]', element).attr('type'), 'password');
			equals($('input[name=password_confirmation]', element).val(), '');
			equals($('input[name=password_confirmation]', element).attr('type'), 'password');
			equals($('input[name=email]', element).val(), 'john@doe.com');
			equals($('input[name=phone]', element).val(), '000-00000');
			equals($('input[name=firstname]', element).val(), 'John');
			equals($('input[name=lastname]', element).val(), 'Doe');
			equals($('input[name=addr_street]', element).val(), '8');
			equals($('input[name=addr_street2]', element).val(), 'Main street');
			equals($('input[name=addr_zip]', element).val(), '5000');
			equals($('input[name=addr_town]', element).val(), 'GhostTown');
			equals($('input[name=addr_state]', element).val(), 'Alabama');
			equals($('input[name=addr_country]', element).val(), 'Yours');
			equals($('input[name=gender]', element).val(), 'Male');
			equals($('input[name=birthdate]', element).val(), '01/01/1970');
			equals($('input[type=submit]').length, 2, 'user info submit');
			equals($('.jpoker_user_info_avatar_upload input[type=submit]').length, 1, 'user info avatar submit');
			$('#' + id).remove();
		    }
		    return true;
		} else {
		    start_and_cleanup();
		    return false;
		}
	    });
    });

test("jpoker.plugins.userInfo update", function(){
        expect(16);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        jpoker.serverDestroy('url');
        server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

	server.serial = 42;
	var PERSONAL_INFO_PACKET = {'rating': 1000, 'firstname': 'John', 'money': {}, 'addr_street': '', 'phone': '', 'cookie': '', 'serial': server.serial, 'password': '', 'addr_country': '', 'name': 'testuser', 'gender': '', 'birthdate': '', 'addr_street2': '', 'addr_zip': '', 'affiliate': 0, 'lastname': 'Doe', 'addr_town': '', 'addr_state': '', 'type': 'PacketPokerPersonalInfo', 'email': ''};

        var id = 'jpoker' + jpoker.serial;
        var place = $('#main');

	server.getPersonalInfo = function() {
	    server.registerUpdate(function(server, what, data) {
		    var element = $('#' + id);
		    if(element.length > 0) {
			equals($(".jpoker_user_info_feedback", element).text(), '');
			$('input[name=password]', element).val('testpassword');
			$('input[name=email]', element).val('alan@smith.com');
			$('input[name=phone]', element).val('000-00000');
			$('input[name=firstname]', element).val('Alan');
			$('input[name=lastname]', element).val('Smith');
			$('input[name=addr_street]', element).val('8');
			$('input[name=addr_street2]', element).val('Main street');
			$('input[name=addr_zip]', element).val('5000');
			$('input[name=addr_town]', element).val('GhostTown');
			$('input[name=addr_state]', element).val('Alabama');
			$('input[name=addr_country]', element).val('Yours');
			$('input[name=gender]', element).val('Male');
			$('input[name=birthdate]', element).val('01/01/1970');
			server.setPersonalInfo = function(info) {
			    equals(info.password, 'testpassword');
			    equals(info.email, 'alan@smith.com');
			    equals(info.phone, '000-00000');
			    equals(info.firstname, 'Alan');
			    equals(info.lastname, 'Smith');
			    equals(info.addr_street, '8');
			    equals(info.addr_street2, 'Main street');
			    equals(info.addr_zip, '5000');
			    equals(info.addr_town, 'GhostTown');
			    equals(info.addr_state, 'Alabama');
			    equals(info.addr_country, 'Yours');
			    equals(info.gender, 'Male');
			    equals(info.birthdate, '01/01/1970');
			    
			    var packet = $.extend(PERSONAL_INFO_PACKET, info, {set_account: true});
			    setTimeout(function() {
				    server.registerUpdate(function(server, what, data) {
					    var element = $('#' + id);
					    if (element.length > 0) {
						equals($(".jpoker_user_info_feedback", element).text(), _("Updated"));
						setTimeout(function() {
							$('#' + id).remove();
							server.notifyUpdate({});
							start_and_cleanup();
						    }, 0);
						return false;
					    }
					});
				    server.notifyUpdate(packet);
				}, 0);
			};			
			$('.jpoker_user_info_submit', element).click(function() {
				equals($(".jpoker_user_info_feedback", element).text(), _("Updating..."));
			    }).click();
			return false;
		    }
		    return true;
		});
	    server.notifyUpdate(PERSONAL_INFO_PACKET);
	};
        place.jpoker('userInfo', 'url');
    });

test("jpoker.plugins.userInfo avatar upload succeed", function(){
        expect(8);
	stop();

        var server = jpoker.serverCreate({ url: 'url', urls: {avatar: 'http://avatar-server/'}});
        server.connectionState = 'connected';

	server.serial = 42;
	var PERSONAL_INFO_PACKET = {'rating': 1000, 'firstname': 'John', 'money': {}, 'addr_street': '', 'phone': '', 'cookie': '', 'serial': server.serial, 'password': '', 'addr_country': '', 'name': 'testuser', 'gender': '', 'birthdate': '', 'addr_street2': '', 'addr_zip': '', 'affiliate': 0, 'lastname': 'Doe', 'addr_town': '', 'addr_state': '', 'type': 'PacketPokerPersonalInfo', 'email': ''};

        var id = 'jpoker' + jpoker.serial;
        var place = $('#main');
	var ajaxform = $.fn.ajaxForm;
	var ajaxFormCallback;
	$.fn.ajaxForm = function(options) {
	    ajaxFormCallback = function() {
		var element = $('#' + id);
		options.beforeSubmit();
		equals($(".jpoker_user_info_avatar_upload_feedback", element).text(), _("Uploading..."));
		$(".jpoker_user_info_avatar_preview", element).css("background-image", "none");
		options.success('<pre>image uploaded</pre>');
		equals($(".jpoker_user_info_avatar_upload_feedback", element).text(), "Uploaded");
		ok($(".jpoker_user_info_avatar_preview", element).css("background-image").indexOf("/42") >= 0, "avatar preview updated");
		setTimeout(function() {
			$('#' + id).remove();
			server.notifyUpdate({});
			start_and_cleanup();
		    }, 0);
	    };
	};
	server.getPersonalInfo = function() {
	    server.registerUpdate(function(server, what, data) {
		    var element = $('#' + id);
		    if(element.length > 0) {
			ok($(".jpoker_user_info_avatar_upload", element).attr("action").indexOf(jpoker.url2hash('url')) >= 0, 'session hash');
			ok($(".jpoker_user_info_avatar_upload", element).attr("action").indexOf(server.urls.upload) >= 0, 'upload url');
			equals($(".jpoker_user_info_avatar_upload_feedback", element).text(), '');
			equals($('.jpoker_user_info_avatar_preview').length, 1, 'user info avatar preview');
			ok($('.jpoker_user_info_avatar_preview').css('background-image').indexOf('42') >= 0, 'user info avatar preview');
			ajaxFormCallback();	
			return false;
		    }
		});
	    server.notifyUpdate(PERSONAL_INFO_PACKET);
	};
        place.jpoker('userInfo', 'url');
    });

test("jpoker.plugins.userInfo avatar upload failed", function(){
        expect(1);
	stop();

        var server = jpoker.serverCreate({ url: 'url', urls: {avatar: 'http://avatar-server/'}});
        server.connectionState = 'connected';

	server.serial = 42;
	var PERSONAL_INFO_PACKET = {'rating': 1000, 'firstname': 'John', 'money': {}, 'addr_street': '', 'phone': '', 'cookie': '', 'serial': server.serial, 'password': '', 'addr_country': '', 'name': 'testuser', 'gender': '', 'birthdate': '', 'addr_street2': '', 'addr_zip': '', 'affiliate': 0, 'lastname': 'Doe', 'addr_town': '', 'addr_state': '', 'type': 'PacketPokerPersonalInfo', 'email': ''};

        var id = 'jpoker' + jpoker.serial;
        var place = $('#main');
	var ajaxform = $.fn.ajaxForm;
	var ajaxFormCallback;
	$.fn.ajaxForm = function(options) {
	    ajaxFormCallback = function() {
		var element = $('#' + id);
		options.beforeSubmit();
		var error_message = 'error';
		options.success(error_message);
		equals($(".jpoker_user_info_avatar_upload_feedback", element).text(), "Uploading failed: " + error_message);
		setTimeout(function() {
			$('#' + id).remove();
			server.notifyUpdate({});
			start_and_cleanup();
		    }, 0);
	    };
	};
	server.getPersonalInfo = function() {
	    server.registerUpdate(function(server, what, data) {
		    var element = $('#' + id);
		    if(element.length > 0) {
			ajaxFormCallback();			
			return false;
		    }
		});
	    server.notifyUpdate(PERSONAL_INFO_PACKET);
	};
        place.jpoker('userInfo', 'url');
    });

test("jpoker.plugins.player: sitout", function(){
        expect(7);

        var id = 'jpoker' + jpoker.serial;
        var player_serial = 1;
        var game_id = 100;
        var money = 1000;
        _SelfPlayerSit(game_id, player_serial, money);
        var server = jpoker.getServer('url');
        var player = jpoker.getPlayer('url', game_id, player_serial);

        // click on sitout, packet sent and sitout button hides
        var sitout = $("#sitout" + id);
        equals(sitout.is(':visible'), true, 'sitout button visible');
        var sent = false;
        sendPacket = server.sendPacket;
        server.sendPacket = function(packet) {
            if(packet.type == 'PacketPokerSitOut') {
                sent = true;
            }
        };
        sitout.click();
        equals(sent, true, 'sitout packet sent');
        equals(sitout.is(':hidden'), true, 'sitout button hidden');

        // when PokerSitOut packet arrives, sitout button is hidden again
        sitout.show();
        var table = server.tables[game_id];
        table.handler(server, game_id, { type: 'PacketPokerSitOut',
                    game_id: game_id,
                    serial: player_serial });
        equals(sitout.is(':hidden'), true, 'sitout button hidden');
        
        cleanup(id);
    });

test("jpoker.plugins.player: sitin", function(){
        expect(8);

        var id = 'jpoker' + jpoker.serial;
        var player_serial = 1;
        var game_id = 100;
	
	var server = jpoker.serverCreate({ url: 'url' });
	var place = $("#main");

	var currency_serial = 42;
	var table_packet = { id: game_id, currency_serial: currency_serial };
	server.tables[game_id] = new jpoker.table(server, table_packet);
	var table = server.tables[game_id];
	
	// table
	place.jpoker('table', 'url', game_id);
	// player
	server.serial = player_serial;
	var player_seat = 2;
	server.tables[game_id].handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
	var player = server.tables[game_id].serial2player[player_serial];
	
	var sitin = $("#sitin" + id);
        equals(sitin.is(':visible'), true, 'sitin button visible');
	
	// player money
	var money = 500;
	var in_game = 44;
	var points = 45;
	var currency_key = 'X' + currency_serial;
	server.userInfo = { money: {} };
	server.userInfo.money[currency_key] = [ money * 100, in_game * 100, points ];

	// buy in
	var packet = { type: 'PacketPokerPlayerChips',
		       money: money * 100,
		       bet: 0,
		       serial: player_serial,
		       game_id: game_id };
	table.handler(server, game_id, packet);

	// sit
	table.handler(server, game_id, { type: 'PacketPokerSit', serial: player_serial, game_id: game_id });
        equals(sitin.is(':hidden'), true, 'sitin button hidden');
	
        table.handler(server, game_id, { type: 'PacketPokerSitOut',
                    game_id: game_id,
                    serial: player_serial });

	equals(sitin.is(':visible'), true, 'sitin button visible');

	// click on sitin, packet sent and sitout button hides
	var packets = [];
        server.sendPacket = function(packet) {
	    packets.push(packet);
        };
        sitin.click();
	equals(packets.length, 2, '2 packets sent');
	equals(packets[0].type, 'PacketPokerAutoBlindAnte', 'autoblind sent');
	equals(packets[1].type, 'PacketPokerSit', 'sit sent');
        equals(sitin.is(':hidden'), true, 'sitin button hidden');

        // when PokerSitIn packet arrives, sitout button is hidden again
        sitin.show();
        table.handler(server, game_id, { type: 'PacketPokerSit',
                    game_id: game_id,
                    serial: player_serial });
        equals(sitin.is(':hidden'), true, 'sitin button hidden');
        
        cleanup(id);
    });

test("jpoker.plugins.playerSelf: create in position", function(){
	expect(1);

	var server = jpoker.serverCreate({ url: 'url' });
	var place = $("#main");
	var game_id = 100;
	var currency_serial = 42;
	var player_serial = 12;
	var player_seat = 2;
	
	var table_packet = { id: game_id, currency_serial: currency_serial };
	server.tables[game_id] = new jpoker.table(server, table_packet);    
	server.tables[game_id].serial_in_position = player_serial;
	
	place.jpoker('table', 'url', game_id);
	// player
	server.serial = player_serial;
	var inPosition = jpoker.plugins.playerSelf.inPosition;
	jpoker.plugins.playerSelf.inPosition = function(player, id) {
	    jpoker.plugins.playerSelf.inPosition = inPosition;
	    equals(player, server.tables[game_id].serial2player[player_serial], "in position");
	};
	server.tables[game_id].handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
    });

test("jpoker.plugins.muck", function(){
        expect(27);

	var place = $("#main");

        var id = 'jpoker' + jpoker.serial;
        var player_serial = 1;
        var game_id = 100;
        var money = 1000;

	var sendAutoMuck = jpoker.plugins.muck.sendAutoMuck;
	jpoker.plugins.muck.sendAutoMuck = function() {
	    ok(true, 'sendAutoMuck called');
	};

	var server = jpoker.serverCreate({ url: 'url' });
	server.preferences.extend({auto_muck_win: false,
		                   auto_muck_lose: false});
	var currency_serial = 42;
	var table_packet = { id: game_id, currency_serial: currency_serial };
	server.tables[game_id] = new jpoker.table(server, table_packet);

	// table
	place.jpoker('table', 'url', game_id);


	// player
	server.serial = player_serial;
	var player_seat = 2;
	server.tables[game_id].handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
	var player = server.tables[game_id].serial2player[player_serial];

	jpoker.plugins.muck.sendAutoMuck = sendAutoMuck;

        var table = server.tables[game_id];
	
	var muck_accept_element = $("#muck_accept" + id);
	equals(muck_accept_element.length, 1, '#muck_accept');
	ok(muck_accept_element.children(0).hasClass('jpoker_muck_accept'), 'jpoker_muck_accept');
	ok(muck_accept_element.children(0).hasClass('jpoker_muck'), 'jpoker_muck');

	var muck_deny_element = $("#muck_deny" + id);
	equals(muck_deny_element.length, 1, '#muck_deny');
	ok(muck_deny_element.children(0).hasClass('jpoker_muck_deny'), 'jpoker_muck_deny');
	ok(muck_deny_element.children(0).hasClass('jpoker_muck'), 'jpoker_muck');

	var auto_muck_element = $('#auto_muck' + id);
	equals(auto_muck_element.length, 1, '#auto_muck');
	ok(auto_muck_element.children(0).hasClass('jpoker_auto_muck'), 'jpoker_auto_muck');
	equals($('input', auto_muck_element).length, 2, 'input');
	equals($('label', auto_muck_element).length, 2, 'label');

	var auto_muck_win = $('#auto_muck_win' + id);
	var auto_muck_lose = $('#auto_muck_lose' + id);
	equals(auto_muck_win.attr('type'), 'checkbox', '#auto_muck_win checkbox');
	equals(auto_muck_lose.attr('type'), 'checkbox', '#auto_muck_win checkbox');
	equals(auto_muck_win.is(':checked'), false, '#auto_muck_win checked preferences');
	equals(auto_muck_lose.is(':checked'), false, '#auto_muck_lose checked preferences');
	
	server.sendPacket = function() {};
	auto_muck_win.click();
	auto_muck_lose.click();
       
	server.sendPacket = function(packet) {
	    equals(packet.auto_muck, 0, 'AUTO_MUCK_NEVER');
	};
	auto_muck_win[0].checked = false;
	auto_muck_lose[0].checked = false;
	jpoker.plugins.muck.sendAutoMuck(server, game_id, id);

	server.sendPacket = function(packet) {
	    equals(packet.auto_muck, 1, 'AUTO_MUCK_WIN');
	};
	auto_muck_win[0].checked = true;
	auto_muck_lose[0].checked = false;
	jpoker.plugins.muck.sendAutoMuck(server, game_id, id);

	server.sendPacket = function(packet) {
	    equals(packet.auto_muck, 2, 'AUTO_MUCK_LOSE');
	};
	auto_muck_win[0].checked = false;
	auto_muck_lose[0].checked = true;
	jpoker.plugins.muck.sendAutoMuck(server, game_id, id);

	server.sendPacket = function(packet) {
	    equals(packet.auto_muck, 3, 'AUTO_MUCK_WIN|AUTO_MUCK_LOSE');
	};
	auto_muck_win[0].checked = true;
	auto_muck_lose[0].checked = true;
	jpoker.plugins.muck.sendAutoMuck(server, game_id, id);
	equals(server.preferences.auto_muck_win, true, 'server.preferences.auto_muck_win updated');
	equals(server.preferences.auto_muck_lose, true, 'server.preferences.auto_muck_lose updated');

        table.handler(server, game_id, { type: 'PacketPokerMuckRequest', serial: player_serial, game_id: game_id, muckable_serials: [player_serial] });
	equals($("#muck_accept" + id).is(':visible'), true, 'muck accept visible');
	equals($("#muck_deny" + id).is(':visible'), true, 'muck deny visible');
	 
	server.sendPacket = function(packet) {
	    equals(packet.type, 'PacketPokerMuckAccept', 'send PacketPokerMuckAccept');
	};
	$("#muck_accept" + id).click();

	server.sendPacket = function(packet) {
	    equals(packet.type, 'PacketPokerMuckDeny', 'send PacketPokerMuckDeny');
	};
	$("#muck_deny" + id).click();

        table.handler(server, game_id, { type: 'PacketPokerState', game_id: game_id, state: 'end' });
        equals($("#muck_accept" + id).is(':hidden'), true, 'muck accept hidden');
        equals($("#muck_deny" + id).is(':hidden'), true, 'muck deny hidden');

        cleanup(id);
    });

test("jpoker.plugins.places", function(){
        expect(8);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

	server.serial = 42;
	var PLAYER_PLACES_PACKET = {type: 'PacketPokerPlayerPlaces', serial: 42, tables: [11, 12, 13], tourneys: [21, 22]};

        var PokerServer = function() {};
        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(PLAYER_PLACES_PACKET) + " ]",

            handle: function(packet) { }
        };
        ActiveXObject.prototype.server = new PokerServer();

        var id = 'jpoker' + jpoker.serial;
        var place = $('#main');

        equals('update' in server.callbacks, false, 'no update registered');
        place.jpoker('places', 'url');
        equals(server.callbacks.update.length, 1, 'places update registered');
	equals($('.jpoker_places', place).length, 1, 'places div');
	server.registerUpdate(function(server, what, data) {
		var element = $('#' + id);
		if(element.length > 0) {
		    if (data.type == 'PacketPokerPlayerPlaces') {
			equals($('.jpoker_places_table', element).length, 3, 'jpoker_places_table');
			equals($('.jpoker_places_tourney', element).length, 2, 'jpoker_places_tourney');
			server.tableJoin = function(id) {
			    equals(id, PLAYER_PLACES_PACKET.tables[0], 'tableJoin called');
			};
			$('.jpoker_places_table', element).eq(0).click();
			server.placeTourneyRowClick = function(server, packet) {
			    equals(packet.game_id, PLAYER_PLACES_PACKET.tourneys[0], 'placeTourneyRowClick called');
			    equals(packet.name, '', 'placeTourneyRowClick called');
			};
			$('.jpoker_places_tourney', element).eq(0).click();
			$('#' + id).remove();
		    }
		    return true;
		} else {
		    start_and_cleanup();
		    return false;
		}
	    });
    });

test("jpoker.plugins.places other serial", function(){
        expect(1);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $('#main');

	server.getPlayerPlaces = function(serial) {
	    equals(serial, 42, 'serial');
	    setTimeout(function() {
		    $('#' + id).remove();
		    server.notifyUpdate({});
		    start_and_cleanup();
		}, 0);
	};
        place.jpoker('places', 'url', {serial: '42'});
    });

test("jpoker.plugins.places link_pattern", function(){
        expect(2);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

	server.serial = 42;
	var PLAYER_PLACES_PACKET = {type: 'PacketPokerPlayerPlaces', serial: 42, tables: [11, 12, 13], tourneys: [21, 22]};

        var PokerServer = function() {};
        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(PLAYER_PLACES_PACKET) + " ]",

            handle: function(packet) { }
        };
        ActiveXObject.prototype.server = new PokerServer();

        var id = 'jpoker' + jpoker.serial;
        var place = $('#main');

	var table_link_pattern = 'http://foo.com/table?game_id={game_id}';
	var tourney_link_pattern = 'http://foo.com/tourney?tourney_serial={tourney_serial}';
        place.jpoker('places', 'url', {table_link_pattern: table_link_pattern, tourney_link_pattern: tourney_link_pattern});
	server.registerUpdate(function(server, what, data) {
		var element = $('#' + id);
		if(element.length > 0) {
		    if (data.type == 'PacketPokerPlayerPlaces') {
			server.tableJoin = function(id) {
			    ok(false, 'tableJoin disabled');
			};
			var table = $('.jpoker_places_table', element).eq(0).click();
			server.placeTourneyRowClick = function(server, id) {
			    ok(false, 'tourneyRowClick disabled');
			};
			var tourney = $('.jpoker_places_tourney', element).eq(0).click();

			var table_link = table_link_pattern.supplant({game_id: 11});
			ok($('td:nth-child(1)', table).html().indexOf(table_link)>=0, table_link);
			var tourney_link = tourney_link_pattern.supplant({tourney_serial: 21});
			ok($('td:nth-child(1)', tourney).html().indexOf(tourney_link)>=0, tourney_link);
			$('#' + id).remove();
		    }
		    return true;
		} else {
		    start_and_cleanup();
		    return false;
		}
	    });
    });

test("jpoker.plugins.playerLookup", function(){
        expect(11);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

	server.serial = 42;
	var PLAYER_PLACES_PACKET = {type: 'PacketPokerPlayerPlaces', name: 'user', tables: [11, 12, 13], tourneys: [21, 22]};

        var id = 'jpoker' + jpoker.serial;
        var place = $('#main');

        equals('update' in server.callbacks, false, 'no update registered');
        place.jpoker('playerLookup', 'url');
        equals(server.callbacks.update.length, 1, 'player_lookup update registered');
	server.registerUpdate(function(server, what, data) {
		var element = $('#' + id);
		if(element.length > 0) {
		    if (data.type == 'PacketPokerPlayerPlaces') {
			equals($('.jpoker_player_lookup_table', element).length, 3, 'jpoker_places_table');
			equals($('.jpoker_player_lookup_tourney', element).length, 2, 'jpoker_places_tourney');
			server.tableJoin = function(id) {
			    equals(id, PLAYER_PLACES_PACKET.tables[0], 'tableJoin called');
			};
			$('.jpoker_player_lookup_table', element).eq(0).click();
			server.placeTourneyRowClick = function(server, packet) {
			    equals(packet.game_id, PLAYER_PLACES_PACKET.tourneys[0], 'placeTourneyRowClick called');
			    equals(packet.name, '', 'placeTourneyRowClick called');
			};
			$('.jpoker_player_lookup_tourney', element).eq(0).click();
			$('#' + id).remove();
		    }
		    return true;
		} else {
		    start_and_cleanup();
		    return false;
		}
	    });
	var player_lookup_element = $('.jpoker_player_lookup');
	equals(player_lookup_element.length, 1, 'player_lookup div');
	equals($('.jpoker_player_lookup_input', player_lookup_element).length, 1, 'player_lookup_input');
	equals($('.jpoker_player_lookup_submit', player_lookup_element).length, 1, 'player_lookup_submit');
	$('.jpoker_player_lookup_input', player_lookup_element).val('user');
	server.sendPacket = function(packet) {
	    equals(packet.name, 'user', 'packet.name');
	    server.queueIncoming([PLAYER_PLACES_PACKET]);
	};
	$('.jpoker_player_lookup_submit', player_lookup_element).click();
    });

test("jpoker.plugins.playerLookup error", function(){
        expect(4);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

	var PLAYER_PLACES_PACKET = {type: 'PacketPokerPlayerPlaces', name: 'user', tables: [11, 12, 13], tourneys: [21, 22]};
	var ERROR_PACKET = {type: 'PacketError', other_type: jpoker.packetName2Type.PACKET_POKER_PLAYER_PLACES};
        var id = 'jpoker' + jpoker.serial;
        var place = $('#main');

	var jpoker_playerLookup_callback_error = jpoker.plugins.playerLookup.callback.error;
	jpoker.plugins.playerLookup.callback.error = function(packet) {
	    ok(true, 'callback error called');
	};
        place.jpoker('playerLookup', 'url');
	server.registerUpdate(function(server, what, data) {
		var element = $('#' + id);
		if(element.length > 0) {
		    if (data.type == 'PacketPokerPlayerPlaces') {
			server.sendPacket = function(packet) {
			    equals($('.jpoker_player_lookup_result', player_lookup_element).html(), '', 'empty result');
			    server.queueIncoming([ERROR_PACKET]);
			};
			$('.jpoker_player_lookup_submit', player_lookup_element).click();
		    } else if (data.type == 'PacketError') {
			equals($('.jpoker_player_lookup_tables', element).length, 0, 'jpoker_places_table');
			equals($('.jpoker_player_lookup_tourneys', element).length, 0, 'jpoker_places_tourney');
			$('#' + id).remove();
		    }
		    return true;
		} else {
		    start_and_cleanup();
		    return false;
		}
	    });
	var player_lookup_element = $('.jpoker_player_lookup', place);
	$('.jpoker_player_lookup_input', player_lookup_element).val('user');
	server.sendPacket = function(packet) {
	    server.queueIncoming([PLAYER_PLACES_PACKET]);
	};
	$('.jpoker_player_lookup_submit', player_lookup_element).click();
    });

test("jpoker.plugins.playerLookup link_pattern", function(){
        expect(2);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

	server.serial = 42;
	var PLAYER_PLACES_PACKET = {type: 'PacketPokerPlayerPlaces', name: 'user', tables: [11, 12, 13], tourneys: [21, 22]};

        var id = 'jpoker' + jpoker.serial;
        var place = $('#main');

	var table_link_pattern = 'http://foo.com/table?game_id={game_id}';
	var tourney_link_pattern = 'http://foo.com/tourney?tourney_serial={tourney_serial}';
        place.jpoker('playerLookup', 'url', {table_link_pattern: table_link_pattern, tourney_link_pattern: tourney_link_pattern});
	server.registerUpdate(function(server, what, data) {
		var element = $('#' + id);
		if(element.length > 0) {
		    if (data.type == 'PacketPokerPlayerPlaces') {
			server.tableJoin = function(id) {
			    ok(false, 'tableJoin disabled');
			};
			var table = $('.jpoker_player_lookup_table', element).eq(0).click();
			server.placeTourneyRowClick = function(server, id) {
			    ok(false, 'tourneyRowClick disabled');
			};
			var tourney = $('.jpoker_player_lookup_tourney', element).eq(0).click();

			var table_link = table_link_pattern.supplant({game_id: 11});
			ok($('td:nth-child(1)', table).html().indexOf(table_link)>=0, table_link);
			var tourney_link = tourney_link_pattern.supplant({tourney_serial: 21});
			ok($('td:nth-child(1)', tourney).html().indexOf(tourney_link)>=0, tourney_link);
			$('#' + id).remove();
		    }
		    return true;
		} else {
		    start_and_cleanup();
		    return false;
		}
	    });
	var player_lookup_element = $('.jpoker_player_lookup');
	$('.jpoker_player_lookup_input', player_lookup_element).val('user');
	server.sendPacket = function(packet) {
	    server.queueIncoming([PLAYER_PLACES_PACKET]);
	};
	$('.jpoker_player_lookup_submit', player_lookup_element).click();
    });

test("jpoker.plugins.playerLookup options", function(){
        expect(2);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

	var PLAYER_PLACES_PACKET = {type: 'PacketPokerPlayerPlaces', name: 'user', tables: [11, 12, 13], tourneys: [21, 22]};
        var id = 'jpoker' + jpoker.serial;
        var place = $('#main');

        place.jpoker('playerLookup', 'url', {dialog: false, tag: 42});
	server.registerUpdate(function(server, what, data) {
		var element = $('#' + id);
		if(element.length > 0) {
		    if (data.type == 'PacketPokerPlayerPlaces') {
			setTimeout(function() {
				$('#' + id).remove();
				server.notifyUpdate({});
				start_and_cleanup();
			    }, 0);
		    }
		    return false;
		}
	    });
	var player_lookup_element = $('.jpoker_player_lookup', place);
	$('.jpoker_player_lookup_input', player_lookup_element).val('user');
	server.getPlayerPlacesByName = function(name, options) {
	    equals(options.dialog, false, 'options dialog');
	    equals(options.tag, 42, 'options tag');
	    server.notifyUpdate(PLAYER_PLACES_PACKET);
	};
	$('.jpoker_player_lookup_submit', player_lookup_element).click();
    });

test("jpoker.plugins.cashier", function(){
        expect(12);
	stop();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

	server.serial = 42;
	var USER_INFO_PACKET = {"rating":1000,"name":"proppy","money":{"X1":[100000,10000,0], "X2":[200000,20000,0]},"affiliate":0,"cookie":"","serial":4,"password":"","type":"PacketPokerUserInfo","email":"","uid__":"jpoker1220102037582"};

        var PokerServer = function() {};
        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(USER_INFO_PACKET) + " ]",

            handle: function(packet) { }
        };
        ActiveXObject.prototype.server = new PokerServer();

        var id = 'jpoker' + jpoker.serial;
        var place = $('#main');

        equals('update' in server.callbacks, false, 'no update registered');
        place.jpoker('cashier', 'url');
        equals(server.callbacks.update.length, 1, 'cashier update registered');
	equals($('.jpoker_cashier').length, 1, 'cashier div');
	server.registerUpdate(function(server, what, data) {
		var element = $('#' + id);
		if(element.length > 0) {
		    if (data.type == 'PacketPokerUserInfo') {
			equals($('.jpoker_cashier_currency', element).length, 2, 'jpoker_places_currency');
			equals($('.jpoker_cashier_currency td:nth-child(1)', element).eq(0).html(), '1', 'jpoker_places_currency amount 1');
			equals($('.jpoker_cashier_currency td:nth-child(2)', element).eq(0).html(), '1000', 'jpoker_places_currency amount 1');
			equals($('.jpoker_cashier_currency td:nth-child(3)', element).eq(0).html(), '100', 'jpoker_places_currency in game 1');
			equals($('.jpoker_cashier_currency td:nth-child(4)', element).eq(0).html(), '0', 'jpoker_places_currency points 1');
			equals($('.jpoker_cashier_currency td:nth-child(1)', element).eq(1).html(), '2', 'jpoker_places_currency amount 2');
			equals($('.jpoker_cashier_currency td:nth-child(2)', element).eq(1).html(), '2000', 'jpoker_places_currency amount 2');
			equals($('.jpoker_cashier_currency td:nth-child(3)', element).eq(1).html(), '200', 'jpoker_places_currency in game 2');
			equals($('.jpoker_cashier_currency td:nth-child(4)', element).eq(1).html(), '0', 'jpoker_places_currency points 2');
			$('#' + id).remove();
		    }
		    return true;
		} else {
		    start_and_cleanup();
		    return false;
		}
	    });
    });

test("jpoker.preferences", function() {
	expect(4);
	
	var hash = jpoker.url2hash('url');
	$.cookie('jpoker_preferences_'+hash, '{"a": 1}');
	var preferences = new jpoker.preferences(hash);
	equals(preferences.a, 1, 'jpoker.preferences.a');
	preferences.extend({'b': 2, 'c': 3});
	equals(preferences.b, 2, 'jpoker.preferences.b');
	equals(preferences.c, 3, 'jpoker.preferences.c');
	equals($.cookie('jpoker_preferences_'+hash), JSON.stringify(preferences), 'cookie updated');
	cleanup();
    });

test("jpoker.preferences defaults values", function() {
	expect(2);

	equals(jpoker.preferences.prototype.auto_muck_win, true);
	equals(jpoker.preferences.prototype.auto_muck_lose, true);
	cleanup();
    });

test("jpoker.preferences in jpoker.server", function() {
	expect(1);
	var hash = jpoker.url2hash('url');
	$.cookie('jpoker_preferences_'+hash, '{"a": 1}');
	var server = jpoker.serverCreate({ url:'url' });
	equals(server.preferences.a, 1, 'server.preferences.a');
	cleanup();
    });

test("profileEnd", function(){
        try {
            console.profileEnd();
        } catch(e) {}
    });

test("$.fn.frame", function(){
        expect(4);
        var element = $("<div id='PID'><div id='ID'></div></div>").appendTo(document.body);
        $('#ID', element).frame('FRAME');
        equals($('#PID > .FRAME > .FRAME-s').size(), 1, 'south div');
        equals($('#PID > .FRAME > #ID').size(), 1, 'ID');
        $('#PID > .FRAME').trigger('mouseenter');
        equals($('#PID > .FRAME-hover').size(), 1, 'class FRAME-hover added');
        $('#PID > .FRAME').trigger('mouseleave');
        equals($('#PID > .FRAME-hover').size(), 0, 'class FRAME-hover removed');
    });

test("IE7Bugs", function(){
    var dialogTest = $("<div id='dialogtest1'>Test Dialog</div>").dialog({width: 'none', height: 'none'});
    equals(dialogTest !== undefined,true, 'UI Dialog Bug on IE (width, height = "none")');
    dialogTest.dialog('close').remove();

    var dialogTestIE7 = $("<div style=\'margin:auto\' id='dialogtest2'>Test Dialog</div>").dialog();
    equals(dialogTestIE7 !== undefined,true, 'UI Dialog Bug on IE (margin = "auto" )');
    dialogTestIE7.dialog('close').remove();

    var limits = [0,0,0];
    var sliderTest = $("<div class=\'ui-slider-1\' id=\'slidertest\'></div>").appendTo("#main").slider({
	    min: limits[0],
	    startValue: limits[1], //IE bug
	    max: limits[2],
	    stepping: 1,
	    change: function(event, ui) {
	    }
	});
    equals($('#slidertest').length, 1, 'UI Slider Bug on IE');    
});

//
// catch leftovers
//
// test("leftovers", function(){
//         expect(1);
//         stop();

//         var PokerServer = function() {};

//         PokerServer.prototype = {
//             outgoing: '[]',

//             handle: function(packet) {
//                 equals(packet, '');
//                 start();
//             }
//         };

//         ActiveXObject.prototype.server = new PokerServer();

        
//     });

