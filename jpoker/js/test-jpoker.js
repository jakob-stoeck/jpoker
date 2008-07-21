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
    jpoker.uninit();
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

test("jpoker.copyright", function(){
        expect(1);
        var copyright = jpoker.copyright();
        equals(copyright.text().indexOf('GNU') >= 0, true, 'GNU');
        copyright.dialog('destroy');
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
        timerRequest = jpoker.refresh(server, request, handler, 'state');
    });

test("jpoker.refresh requireSession", function(){
        expect(1);

        var server = jpoker.serverCreate({ url: 'url' });

        equals(jpoker.refresh(server, null, null, 'state', { requireSession: true }).timer, 0, 'requireSession');

        cleanup();
    });

//
// jpoker.server
//
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
                    }
                }
                return true;
            });

        server.reconnect();
        equals(server.session.indexOf('clear') >= 0, false, 'session is set');
    });

test("jpoker.server.reconnect failure", function(){
        expect(3);
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
                        equals(server.session.indexOf('clear') >= 0, true, 'session is not set');
                        start_and_cleanup();
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
            equals(message.indexOf(code) >= 0, true, 'invalid error code');
            jpoker.error = error;
            start_and_cleanup();
        };
        server.reconnect();
    });

test("jpoker.server.rejoin", function(){
        expect(5);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        var PokerServer = function() {};
        PokerServer.prototype = {
            outgoing: '[{"type": "PacketPokerTableList", "packets": [{"id": ' + game_id + '}]}]',

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);
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
                        equals(server.session.indexOf('clear') >= 0, true, 'session is not set');
                        start_and_cleanup();
                    }
                }
                return true;
            });
        server.tableJoin = function(other_game_id) {
            equals(other_game_id, game_id, 'rejoin same table');
        };

        server.getUserInfo = function() {
            equals(true, true, 'getUserInfo called');
        };

        server.rejoin();
    });

test("jpoker.server.login", function(){
        expect(12);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        equals(server.loggedIn(), false);
        equals(server.pinging(), false);

        var packets = [];
        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: '[{"type": "PacketAuthOk"}, {"type": "PacketPokerRoles"}, {"type": "PacketSerial", "serial": 1}]',

            handle: function(packet) { packets.push(packet); }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var logname = "name";
        equals(server.session.indexOf('session=clear'), 0, "does not have session");
        server.login(logname, "password");
        server.registerUpdate(function(server, what, packet) {
                switch(packet.type) {
                case "PacketSerial":
                    equals(packets[0].indexOf('PacketPokerExplain') >= 0, true, 'Explain');
                    equals(packets[1].indexOf('PacketPokerSetRole') >= 0, true, 'SetRole');
                    equals(packets[2].indexOf('PacketLogin') >= 0, true, 'Login');
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

test("jpoker.server.logout", function(){
        expect(5);
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
                equals(server.session.indexOf('session=clear'), 0, "does not have session");
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
        expect(4);

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
		if (packet.type == 'PacketError')
		    server.queueRunning(start_and_cleanup);
		return true;
            });
        server.tourneyRegister(game_id);
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
	var ERROR_PACKET = {'message':'server error message','code':3,'type':'PacketError','other_type':117}

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
		if (packet.type == 'PacketError')
		    server.queueRunning(start_and_cleanup);
		return true;
            });
        server.tourneyUnregister(game_id);
    });

test("jpoker.server.getPersonalInfo", function(){
        expect(0);
	stop();

        var serial = 42;
	var PERSONAL_INFO_PACKET = {"rating": 1000, "firstname": "", "money": {}, "addr_street": "", "phone": "", "cookie": "", "serial": serial, "password": "", "addr_country": "", "name": "testuser", "gender": "", "birthdate": "", "addr_street2": "", "addr_zip": "", "affiliate": 0, "lastname": "", "addr_town": "", "addr_state": "", "type": "PacketPokerPersonalInfo", "email": ""};

        var server = jpoker.serverCreate({ url: 'url' });

        server.serial = serial;
	
        server.sendPacket = function(packet) {
            equals(packet.type, "PacketPokerGetPersonalInfo");
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
            equals(this.connectionState, 'disconnected');
            start();
        };
        self.connectionState = 'connected';
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
            return true;
        };
        self.registerHandler(0, handler);
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
                if(packet.indexOf("PacketPing") >= 0 || packet.indexOf("PacketPokerExplain") >= 0) {
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
                start_and_cleanup();
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


test("jpoker.table.handler: PacketPokerBetLimit", function(){
        expect(6);

        var server = jpoker.serverCreate({ url: 'url' });
        var game_id = 100;

        // define user & money
        var player_serial = 22;
        server.serial = player_serial;

        // define table
        table_packet = { id: game_id };
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

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);
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
    });

test("jpoker.table.handler: PacketPokerTable", function(){
        expect(6);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);
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
        table_packet = { id: game_id, currency_serial: currency_serial };
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

//
// tableList
//
test("jpoker.plugins.tableList", function(){
        expect(8);
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
                    $("#" + id).remove();
                    return true;
                } else {
                    equals(server.callbacks.update.length, 2, 'tableList and test update registered');
                    equals('tableList' in server.timers, true, 'timer active');
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

//
// regularTourneyList
//
test("jpoker.plugins.regularTourneyList", function(){
        expect(9);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_LIST_PACKET = {"players": 0, "packets": [{"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 1, "sit_n_go": "y", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval" : 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 39, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first" : 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 40, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial" : 41, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 42, "sit_n_go": "n", "registered": 0}], "tourneys": 5, "type": "PacketPokerTourneyList"};
	var start_time = TOURNEY_LIST_PACKET.packets[1].start_time;

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
		    equals($('.headerSortDown', tr[0]).text(), 'Start Time', "headerSortDown");
                    $("#" + id).remove();
                    return true;
                } else {
                    equals(server.callbacks.update.length, 2, 'regularTourneyList and test update registered');
                    equals('tourneyList' in server.timers, true, 'timer active');
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

//
// sitngoTourneyList
//
test("jpoker.plugins.sitngoTourneyList", function(){
        expect(9);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_LIST_PACKET = {"players": 0, "packets": [{"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 1, "sit_n_go": "y", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval" : 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 39, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first" : 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 40, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial" : 41, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 42, "sit_n_go": "n", "registered": 0}], "tourneys": 5, "type": "PacketPokerTourneyList"};
	var buy_in = TOURNEY_LIST_PACKET.packets[0].buy_in/100;

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
		    equals($('.headerSortDown', tr[0]).text(), 'Buy In', "headerSortDown");
                    $("#" + id).remove();
                    return true;
                } else {
                    equals(server.callbacks.update.length, 2, 'sitngoTourneyList and test update registered');
                    equals('tourneyList' in server.timers, true, 'timer active');
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

//
// tourneyDetails
//
test("jpoker.plugins.tourneyDetails", function(){
        expect(8);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_PLAYERS_LIST_PACKET = {"game_id": 0, "serial": 1, "cookie": "", "type": "PacketPokerTourneyPlayersList", "players": [["player0", -1, 0], ["player1", -1, 0], ["player2", -1, 0], ["player3", -1, 0], ["player4", -1, 0], ["player5", -1, 0], ["player6", -1, 0], ["player7", -1, 0], ["player8", -1, 0], ["player9", -1, 0]]};
	var tourney_serial = TOURNEY_PLAYERS_LIST_PACKET.serial;
	var players_count = TOURNEY_PLAYERS_LIST_PACKET.players.length;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_PLAYERS_LIST_PACKET) + " ]",

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
        place.jpoker('tourneyDetails', 'url', tourney_serial.toString());
        equals(server.callbacks.update.length, 1, 'tourneyDetails update registered');
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
                    var tr = $("#" + id + " tr", place);
                    equals(tr.length, players_count+1, 'tourneyDetails players_count');
		    var input = $("#" + id + " input");
		    equals(input.length, 0, 'no tourneyDetails register button');
                    $("#" + id).remove();
                    return true;
                } else {
                    equals(server.callbacks.update.length, 2, 'tourneyDetails and test update registered');
                    equals('tourneyDetails' in server.timers, true, 'timer active');
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

//
// tourneyDetails.register
//
test("jpoker.plugins.tourneyDetails.register", function(){
        expect(2);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_PLAYERS_LIST_PACKET = {"game_id": 0, "serial": 1, "cookie": "", "type": "PacketPokerTourneyPlayersList", "players": [["player0", -1, 0], ["player1", -1, 0], ["player2", -1, 0], ["player3", -1, 0], ["player4", -1, 0], ["player5", -1, 0], ["player6", -1, 0], ["player7", -1, 0], ["player8", -1, 0], ["player9", -1, 0]]};
	var tourney_serial = TOURNEY_PLAYERS_LIST_PACKET.serial;
	var players_count = TOURNEY_PLAYERS_LIST_PACKET.players.length;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_PLAYERS_LIST_PACKET) + " ]",

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
		    var input = $("#" + id + " input");
		    equals(input.val(), "Register");
		    server.tourneyRegister = function(game_id) {
			equals(tourney_serial, game_id);
			start_and_cleanup();
		    };
		    input.click();	    
                    $("#" + id).remove();
                    return false;
		}
            });
    });

//
// tourneyDetails.unregister
//
test("jpoker.plugins.tourneyDetails.unregister", function(){
        expect(2);
        stop();

        //
        // Mockup server that will always return TOURNEY_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

	var TOURNEY_PLAYERS_LIST_PACKET = {"game_id": 0, "serial": 1, "cookie": "", "type": "PacketPokerTourneyPlayersList", "players": [["player0", -1, 0], ["player1", -1, 0], ["player2", -1, 0], ["player3", -1, 0], ["player4", -1, 0], ["player5", -1, 0], ["player6", -1, 0], ["player7", -1, 0], ["player8", -1, 0], ["player9", -1, 0]]};
	var tourney_serial = TOURNEY_PLAYERS_LIST_PACKET.serial;
	var players_count = TOURNEY_PLAYERS_LIST_PACKET.players.length;

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TOURNEY_PLAYERS_LIST_PACKET) + " ]",

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
	server.serial = 42;
        place.jpoker('tourneyDetails', 'url', tourney_serial.toString());
        server.registerUpdate(function(server, what, data) {
                var element = $("#" + id);
                if(element.length > 0) {
		    var input = $("#" + id + " input");
		    equals(input.val(), "Unregister");
		    server.tourneyUnregister = function(game_id) {
			equals(tourney_serial, game_id);
			start_and_cleanup();
		    };
		    input.click();
                    $("#" + id).remove();
                    return false;
                }
            });
    });

//
// featuredTable
//
test("jpoker.plugins.featuredTable", function(){
        expect(4);
        stop();

        //
        // Mockup server that will always return TABLE_LIST_PACKET,
        // whatever is sent to it.
        //
        var PokerServer = function() {};

        var TABLE_LIST_PACKET = {"players": 4, "type": "PacketPokerTableList", "packets": [{"observers": 1, "name": "One", "percent_flop" : 98, "average_pot": 1535, "seats": 10, "variant": "holdem", "hands_per_hour": 220, "betting_structure": "2-4-limit", "currency_serial": 1, "muck_timeout": 5, "players": 2, "waiting": 0, "skin": "default", "id": 100, "type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Two", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 101,"type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Three", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-pot-limit", "currency_serial": 1, "muck_timeout": 5, "players": 2, "waiting": 0, "skin": "default", "id": 102,"type": "PacketPokerTable", "player_timeout": 60}]};

        PokerServer.prototype = {
            outgoing: "[ " + JSON.stringify(TABLE_LIST_PACKET) + " ]",

            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerServer();

        var server = jpoker.serverCreate({ url: 'url' });
        server.connectionState = 'connected';

        var id = 'jpoker' + jpoker.serial;
        var place = $("#main");
        server.tableRowClick = function(server, packet) {
            equals(packet.players, 2, 'nplayers');
            equals(packet.name, 'One', 'nplayers');
            equals(packet.game_id, packet.id, 'game_id field');
            start_and_cleanup();
        };
        place.jpoker('featuredTable', 'url');
        equals('tableList' in server.timers, false, 'timer not active');
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

        cleanup(id);
    });

//
// table
//
test("jpoker.plugins.table", function(){
        expect(19);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

        var game_id = 100;

        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: '[{"type": "PacketPokerTable", "id": ' + game_id + '}]',

            handle: function(packet) {
                if(packet.indexOf("PacketPing") >= 0 || packet.indexOf("PacketPokerExplain") >= 0) {
                    return;
                }
                equals(packet, '{"type":"PacketPokerTableJoin","game_id":' + game_id + '}');
            }
        };

        ActiveXObject.prototype.server = new PokerServer();

        place.jpoker('table', 'url', game_id);
        var handler = function(server, what, packet) {
            if(packet.type == 'PacketPokerTable') {
                content = $("#" + id).text();
                for(var seat = 0; seat < 10; seat++) {
                    equals($("#seat" + seat + id).size(), 1, "seat " + seat);
                }
                var names = jpoker.plugins.playerSelf.names;
                for(var name = 0; name < names.length; name++) {
                    equals($("#" + names[name] + id).css('display'), 'none', names[name]);
                }
                equals($('#jpokerSound').size(), 1, 'jpokerSound');
                start_and_cleanup();
                return false;
            } else {
                return true;
            }
        };
        server.registerUpdate(handler);
	content = $("#" + id).text();
	equals(content.indexOf("connecting") >= 0, true, "connecting");
    });

test("jpoker.plugins.table.reinit", function(){
        expect(18);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;

        var game_id = 100;

        var PokerServer = function() {};

        PokerServer.prototype = {
            outgoing: '[{"type": "PacketPokerTable", "id": ' + game_id + '}]',

            handle: function(packet) {
                if(packet.indexOf("PacketPing") >= 0 || packet.indexOf("PacketPokerExplain") >= 0) {
                    return;
                }
                equals(packet, '{"type":"PacketPokerTableJoin","game_id":' + game_id + '}');
            }
        };

        ActiveXObject.prototype.server = new PokerServer();

        place.jpoker('table', 'url', game_id);
        var handler = function(server, what, packet) {
            if(packet.type == 'PacketPokerTable') {
                content = $("#" + id).text();
                for(var seat = 0; seat < 10; seat++) {
                    equals($("#seat" + seat + id).size(), 1, "seat " + seat);
                }
                var names = jpoker.plugins.playerSelf.names;
                for(var name = 0; name < names.length; name++) {
                    equals($("#" + names[name] + id).css('display'), 'none', names[name]);
                }
                start_and_cleanup();
                return false;
            } else {
                return true;
            }
        };
        server.registerUpdate(handler);
	content = $("#" + id).text();
	equals(content.indexOf("connecting") >= 0, true, "connecting");
    });

test("jpoker.plugins.table.chat", function(){
        expect(10);

        var server = jpoker.serverCreate({ url: 'url' });
        var player_serial = 1;
        server.serial = player_serial; // pretend logged in
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);
        var chat = $("#chat" + id);
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
            equals(packet.message, 'ABC');
            sent = true;
        };
        $('input', chat).attr('value', 'A\'B"C\n');
        chat.triggerKeypress("13");
        equals(sent, true, "packet sent");
        equals($('input', chat).attr('value'), ' ', 'input is reset');
        table.handler(server, game_id, { type: 'PacketPokerPlayerLeave', seat: 0, serial: player_serial, game_id: game_id });
        equals(chat.is(':hidden'), true, "chat hidden (2)");
        cleanup(id);
    });

test("jpoker.plugins.table: PokerPlayerArrive/Leave", function(){
        expect(18);

        var server = jpoker.serverCreate({ url: 'url' });
        var player_serial = 1;
        server.serial = player_serial; // pretend logged in
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        $('#jpokerRebuy').remove(); // just in case it pre-existed
        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);
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
			      url: 'mycustomavatar.png'
                              });
        equals($("#jpokerSound " + jpoker.sound).attr("src").indexOf('arrive') >= 0, true, 'sound arrive');
        equals($("#seat0" + id).css('display'), 'block', "arrive");
        equals($("#sit_seat0" + id).css('display'), 'none', "seat0 hidden");
        equals($("#player_seat0_name" + id).html(), 'click to sit', "username arrive");
	ok($("#player_seat0_avatar" + id).css('background-image').indexOf("mycustomavatar.png") >= 0, "custom avatar");
        equals($("#jpokerRebuy").size(), 1, 'rebuy dialog launched for self');
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

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);
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

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);
        equals($("#board0" + id).size(), 1, "board0 DOM element");
        equals($("#board0" + id).css('display'), 'none', "board0 hidden");
        equals(table.board[0], null, "board0 empty");
        var card_value = 1;
        table.handler(server, game_id, { type: 'PacketPokerBoardCards', cards: [card_value], game_id: game_id });
        equals($("#board0" + id).css('display'), 'block', "card 1 set");
        var background = $("#board0" + id).css('background-image');
	equals(background.indexOf("small-3h") >= 0, true, "background " + background);
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

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);
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

test("jpoker.plugins.table: PacketPokerDealer", function(){
        expect(6);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);
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
        expect(4);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        server.notifyUpdate(table_packet);
        var table = server.tables[game_id];
        var player_serial = 1;
        var player_seat = 2;
        var player_name = 'username';
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id, name: player_name });
        equals($("#chat_history" + id).size(), 1, "chat history DOM element");
        var message = 'voila\ntout';
        table.handler(server, game_id, { type: 'PacketPokerChat', message: message, game_id: game_id, serial: player_serial });
        var content = $("#chat_history" + id).text();
        equals(content.indexOf(message) >= 0, false, "message is split");
        equals(content.indexOf('tout') >= 0, true, "message part is displayed");
        equals(content.indexOf(player_name) >= 0, true, "player_name displayed");
        cleanup();
    });

test("jpoker.plugins.table: PacketPokerPosition", function(){
        expect(10);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var player_name = 'username';
        var table = server.tables[game_id];
        for(var i = 1; i <= 3; i++) {
            table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: i, serial: i * 10, game_id: game_id, name: player_name + i });
            table.serial2player[i * 10].sit = true;
        }
        server.notifyUpdate(table_packet);
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

        start_and_cleanup();
    });

test("jpoker.plugins.table: PacketPokerPotChips/Reset", function(){
        expect(9);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);
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
        return;
    });

test("jpoker.plugins.table: PacketSerial ", function(){
        expect(7);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        server.notifyUpdate(table_packet);
        var table = server.tables[game_id];
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

//
// player
//
test("jpoker.plugins.player: PacketPokerPlayerCards", function(){
        expect(6);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        server.notifyUpdate(table_packet);
        var player_serial = 1;
        var player_seat = 2;
        table.handler(server, game_id, { type: 'PacketPokerPlayerArrive', seat: player_seat, serial: player_serial, game_id: game_id });
        var player = server.tables[game_id].serial2player[player_serial];
        equals(player.serial, player_serial, "player_serial");

        var card = $("#card_seat" + player_seat + "0" + id);
        var card_value = 1;
        equals(card.size(), 1, "seat 2, card 0 DOM element");
        equals(card.css('display'), 'none', "seat 2, card 0 hidden");
        equals(player.cards[0], null, "player card empty");
        table.handler(server, game_id, { type: 'PacketPokerPlayerCards', cards: [card_value], serial: player_serial, game_id: game_id });
        var background = card.css('background-image');
	equals(background.indexOf("small-3h") >= 0, true, "background " + background);
        equals(player.cards[0], card_value, "card in slot 0");
        
        start_and_cleanup();
    });

test("jpoker.plugins.player: PacketPokerPlayerChips", function(){
        expect(15);
        stop();

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        server.notifyUpdate(table_packet);
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

test("jpoker.plugins.player: PokerPlayerSeat", function(){
        expect(6);

        var server = jpoker.serverCreate({ url: 'url' });
        var place = $("#main");
        var id = 'jpoker' + jpoker.serial;
        var game_id = 100;

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);
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

        place.jpoker('table', 'url', game_id);
        table_packet = { id: game_id };
        server.tables[game_id] = new jpoker.table(server, table_packet);
        var table = server.tables[game_id];
        server.notifyUpdate(table_packet);
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

function _SelfPlayer(game_id, player_serial) {
    var server = jpoker.serverCreate({ url: 'url' });
    var place = $("#main");

    // table
    var currency_serial = 42;
    place.jpoker('table', 'url', game_id);
    table_packet = { id: game_id, currency_serial: currency_serial };
    server.tables[game_id] = new jpoker.table(server, table_packet);
    server.notifyUpdate(table_packet);
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
        expect(55);

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
        equals($(".jpoker_raise_min", raise).html(), Z.table.betLimit.min, 'min');
        equals($(".jpoker_raise_current", raise).html(), Z.table.betLimit.min, 'current');
        equals($(".jpoker_raise_max", raise).html(), Z.table.betLimit.max, 'max');
        equals(raise.is(':visible'), true, 'raise range visible');
        var slider = $('.ui-slider-1', raise);
        //        $('.ui-slider-handle', raise).parent().triggerKeydown("38");
        // equals($(".jpokerRaiseCurrent", raise).attr('title'), Z.table.betLimit.min, 'value changed');
        Z.table.handler(Z.server, game_id, { type: 'PacketPokerSelfLostPosition', serial: 333, game_id: game_id });

        cleanup(id);
    });

test("jpoker.plugins.player: rebuy", function(){
        expect(19);

        var id = 'jpoker' + jpoker.serial;
        var player_serial = 1;
        var game_id = 100;
        _SelfPlayer(game_id, player_serial);
        var server = jpoker.getServer('url');
        var player = jpoker.getPlayer('url', game_id, player_serial);

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

