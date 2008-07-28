//
//     Copyright (C) 2008 Loic Dachary <loic@dachary.org>
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
$.fn.triggerKeypress = function(keyCode) {
    return this.trigger("keypress", [$.event.fix({event:"keypress", keyCode: keyCode, target: this[0]})]);
};

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
            this.server.outgoing = '[]';
        }
    },

    server: {
        outgoing: '[]',
        handle: function(packet) { }
    }
};

explain = true;

function setUp() {
    $.jpoker.verbose = 1;

    $('#table').empty();
    $('#place').empty();
    $('#text').hide();

    $('#jpoker_copyright').dialog('destroy');
    $('#jpoker_dialog').dialog('destroy').remove();
    $('.jpoker_login').remove();
    $('.jpoker_table_list').remove();
    $('.jpoker_server_status').remove();

    $.jpoker.uninit();
    //
    // disable ping logic by setting a very large frequency
    ///
    $.jpoker.serverCreate({ url: 'url', pingFrequency: 20000000 });
};

function jpoker_01_copyright(place) {
    setUp();
    $.jpoker.copyright();
};

function jpokerLogin(place) {
        $(place).jpoker('login', config.jpoker.restURL);
};

function jpokerServerStatus(place) {
        $(place).jpoker('serverStatus', config.jpoker.restURL);
};

function jpokerTableList(place) {
        $(place).jpoker('tableList', config.jpoker.restURL);
};

function jpoker_02_join(place) {
        setUp();
        if(explain) {
            $(place).append('A player just arrived at the table, he is sit out and has no money in front of him.');
            $(place).append('The player name can be 50 characters at most.');
            $(place).append('<hr>');
        }

        var game_id = 100;
        var player_serial = 200;
        var packets = [
{ type: 'PacketPokerTable', id: game_id },
{ type: 'PacketPokerPlayerArrive', seat: 0, serial: player_serial, game_id: game_id, name: 'verylongusername' }
                       ];
        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };

        var server = $.jpoker.getServer('url');
        server.spawnTable = function(server, packet) {
	    $(place).jpoker('table', 'url', game_id, 'ONE');
	};
        server.sendPacket('ping');
};

function jpoker_03_joinBuyIn(place) {
        setUp();
        if(explain) {
            $(place).append('A player arrived at the table, he is sit out he brings money at the table.');
            $(place).append('<hr>');
        }

        var game_id = 100;
        var player_serial = 200;
        var packets = [
{ type: 'PacketPokerTable', id: game_id }
                       ];
        var money = 2;
        for(var i = 0; i < 10; i++) {
            packets.push({ type: 'PacketPokerPlayerArrive', serial: player_serial + i, game_id: game_id, seat: i, name: 'username' + i });
            packets.push({ type: 'PacketPokerPlayerChips', serial: player_serial + i, game_id: game_id, money: money, bet: 0 });
            money *= 10;
        }

        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };

        var server = $.jpoker.getServer('url');
        server.spawnTable = function(server, packet) {
	    $(place).jpoker('table', 'url', game_id, 'ONE');
	};
        server.sendPacket('ping');
};

function jpoker_03_playerBet(place) {
        setUp();
        if(explain) {
            $(place).append('A player is sit, with money at the table and a bet.');
            $(place).append('<hr>');
        }

        var game_id = 100;
        var player_serial = 200;
        var packets = [
{ type: 'PacketPokerTable', id: game_id }
                       ];
        var money = 2;
        var bet = 80000;
        for(var i = 0; i < 10; i++) {
            packets.push({ type: 'PacketPokerPlayerArrive', serial: player_serial + i, game_id: game_id, seat: i, name: 'username' + i });
            packets.push({ type: 'PacketPokerSit', serial: player_serial + i, game_id: game_id });
            packets.push({ type: 'PacketPokerPlayerChips', serial: player_serial + i, game_id: game_id, money: money, bet: bet });
            money *= 10;
            bet *= 10;
        }

        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };

        var server = $.jpoker.getServer('url');
        server.spawnTable = function(server, packet) {
	    $(place).jpoker('table', 'url', game_id, 'ONE');
	};
        server.sendPacket('ping');
};

function jpoker_04_playerInPosition(place) {
        setUp();
        if(explain) {
            $(place).append('The player username0 is to act / is in position.');
            $(place).append('<hr>');
        }

        var game_id = 100;
        var player_serial = 200;
        var packets = [
{ type: 'PacketPokerTable', id: game_id }
                       ];
        var money = 2;
        for(var i = 0; i < 10; i++) {
            packets.push({ type: 'PacketPokerPlayerArrive', serial: player_serial + i, game_id: game_id, seat: i, name: 'username' + i });
            packets.push({ type: 'PacketPokerSit', serial: player_serial + i, game_id: game_id });
            packets.push({ type: 'PacketPokerPlayerChips', serial: player_serial + i, game_id: game_id, money: money, bet: 0 });
            money *= 10;
        }
        packets.push({ type: 'PacketPokerPosition', serial: player_serial, game_id: game_id });

        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };

        var server = $.jpoker.getServer('url');
        server.spawnTable = function(server, packet) {
	    $(place).jpoker('table', 'url', game_id, 'ONE');
	};
        server.sendPacket('ping');
};

function jpoker_05_selfPlayer(place) {
        setUp();
        if(explain) {
            $(place).append('The logged in player is sit at the table, buy in dialog shows.');
            $(place).append('<hr>');
        }

        var game_id = 100;
        var player_serial = 200;
        var packets = [
{ type: 'PacketSerial', serial: player_serial },
{ type: 'PacketPokerTable', id: game_id },
{ type: 'PacketPokerPlayerArrive', seat: 0, serial: player_serial, game_id: game_id, name: 'myself' }
                       ];
        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };

        var server = $.jpoker.getServer('url');
        server.spawnTable = function(server, packet) {
	    $(place).jpoker('table', 'url', game_id, 'ONE');
	};
        server.sendPacket('ping');
};

function jpoker_06_selfInPosition(place) {
        setUp();
        if(explain) {
            $(place).append('The logged in player is in position.');
            $(place).append('<hr>');
        }

        var game_id = 100;
        var player_serial = 200;
        var packets = [
{ type: 'PacketSerial', serial: player_serial },
{ type: 'PacketPokerTable', id: game_id },
{ type: 'PacketPokerPlayerArrive', seat: 0, serial: player_serial, game_id: game_id, name: 'myself' },
{ type: 'PacketPokerPlayerChips', serial: player_serial, game_id: game_id, money: 1000000, bet: 0 },
{ type: 'PacketPokerSit', serial: player_serial, game_id: game_id },
{ type: 'PacketPokerBetLimit',
                       game_id: game_id,
                       min:   500,
                       max: 20000,
                       step:  100,
                       call: 1000,
                       allin:4000,
                       pot:  2000
},
{ type: 'PacketPokerSelfInPosition', serial: player_serial, game_id: game_id },
{ type: 'one' },
{ type: 'two' },
{ type: 'three' }
                       ];
        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };
        var server = $.jpoker.getServer('url');
        server.spawnTable = function(server, packet) {
	    $(place).jpoker('table', 'url', game_id, 'ONE');
	};
        server.sendPacket('ping');
        server.registerHandler(0, function(server, dummy, packet) {
                if(packet.type == 'two') {
                } else if(packet.type == 'three') {
                    server.notifyUpdate();
                    return false;
                }
                return true;
            });
        
};

function jpoker_07_joining(place) {
        setUp();
        if(explain) {
            $(place).append('A request to join the table was sent to the poker server and the HTML element where the table is going to be displayed has been created, with a message showing the table description is expected to arrive from the server.');
            $(place).append('<hr>');
        }

        var game_id = 100;
        $(place).jpoker('table', 'url', game_id, 'ONE');
};

function jpoker_08_all(place) {
        setUp();
        if(explain) {
            $(place).append('All community cards and all pots are displayed.');
            $(place).append('<hr>');
        }

        var game_id = 100;
        var player_serial = 200;
        var packets = [
{ type: 'PacketPokerTable', id: game_id }
                       ];
        var money = 2;
        var bet = 8;
        for(var i = 0; i < 10; i++) {
            packets.push({ type: 'PacketPokerPlayerArrive', serial: player_serial + i, game_id: game_id, seat: i, name: 'username' + i });
            packets.push({ type: 'PacketPokerPlayerChips', serial: player_serial + i, game_id: game_id, money: money, bet: bet });
            packets.push({ type: 'PacketPokerPlayerChips', serial: player_serial + i, game_id: game_id, money: money, bet: bet });
            packets.push({ type: 'PacketPokerPlayerCards', serial: player_serial + i, game_id: game_id, cards: [ 13, 14, 15, 16, 17, 18, 19 ] });
            packets.push({ type: 'PacketPokerPotChips', game_id: game_id, index: i, bet: [ 1, bet ] });
            bet *= 10;
            money *= 10;
        }
        packets.push({ type: 'PacketPokerBoardCards', game_id: game_id, cards: [1, 2, 3, 4, 5] });

        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };
        var server = $.jpoker.getServer('url');
        server.spawnTable = function(server, packet) {
	    $(place).jpoker('table', 'url', game_id, 'ONE');
	};
        server.sendPacket('ping');
};

function jpoker_09_dialog(place) {
        setUp();
        if(explain) {
            $(place).append('Dialog box used for various game messages and notifications.');
            $(place).append('<hr>');
        }

        $.jpoker.dialog('Dialog box used for various game messages and notifications.');
};

function jpoker_20_login(place) {
        setUp();
        if(explain) {
            $(place).append('Player is logged out.');
            $(place).append('<hr>');
        }

        $(place).jpoker('login', 'url');
        $("#name", place).attr('value', 'username');
        $("#password", place).attr('value', 'randompassword');
};

function jpoker_21_loginProgress(place) {
        setUp();
        if(explain) {
            $(place).append('Login request was sent, waiting for answer.');
            $(place).append('<hr>');
        }

        var server = $.jpoker.getServer('url');

        $(place).jpoker('login', 'url');
        $(".jpoker_login_name", place).attr('value', 'username');
        $(".jpoker_login_password", place).attr('value', 'randompassword');
        server.login = function() {};
        $(".jpoker_login", place).triggerKeypress("13");

        
};

function jpoker_22_logout(place) {
        setUp();
        if(explain) {
            $(place).append('User is logged in, one choice only : logout.');
            $(place).append('<hr>');
        }

        var server = $.jpoker.getServer('url');
        server.serial = 1;

        $(place).jpoker('login', 'url');
};

function jpoker_30_statusDisconnected(place) {
        setUp();
        if(explain) {
            $(place).append('disconnected from server.');
            $(place).append('<hr>');
        }

        $(place).jpoker('serverStatus', 'url');
};

function jpoker_31_connectedTables(place) {
        setUp();
        if(explain) {
            $(place).append('connected to server, with tables and no players.');
            $(place).append('<hr>');
        }

        var server = $.jpoker.getServer('url');

        server.connectionState = 'connected';
        server.tablesCount = 10;
        $(place).jpoker('serverStatus', 'url');
};

function jpoker_32_connectedTablesPlayers(place) {
        setUp();
        if(explain) {
            $(place).append('connected to server, with tables and players.');
            $(place).append('<hr>');
        }

        var server = $.jpoker.getServer('url');

        server.connectionState = 'connected';
        server.tablesCount = 10;
        server.playersCount = 23;
        $(place).jpoker('serverStatus', 'url');
};

function jpoker_40_tableList(place) {
        setUp();
        if(explain) {
            $(place).append('List of poker tables available on the server.');
            $(place).append('<hr>');
        }

        var packets = [ {"players": 4, "type": "PacketPokerTableList", "packets": [{"observers": 1, "name": "One", "percent_flop" : 98, "average_pot": 100, "seats": 10, "variant": "holdem", "hands_per_hour": 220, "betting_structure": "2-4-limit", "currency_serial": 1, "muck_timeout": 5, "players": 4, "waiting": 0, "skin": "default", "id": 100, "type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Two", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 101,"type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Three", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-pot-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 102,"type": "PacketPokerTable", "player_timeout": 60}]} ];

        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };
        var server = $.jpoker.getServer('url');

        $(place).jpoker('tableList', 'url');
};

function jpoker_50_sitOut(place) {
        setUp();
        if(explain) {
            $(place).append('A player is sit out, meaning he occupies a site but does not participate in the game.');
            $(place).append('<hr>');
        }

        var game_id = 100;
        var player_serial = 200;
        var packets = [
{ type: 'PacketPokerTable', id: game_id },
{ type: 'PacketPokerPlayerArrive', seat: 0, serial: player_serial, game_id: game_id, name: 'USER' },
{ type: 'PacketPokerPlayerChips', serial: player_serial, game_id: game_id, money: 200, bet: 0 }
                       ];
        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };
        var server = $.jpoker.getServer('url');
        server.spawnTable = function(server, packet) {
	    $(place).jpoker('table', 'url', game_id, 'ONE');
	};
        server.sendPacket('ping');
};

function jpoker_51_sit(place) {
        setUp();
        if(explain) {
            $(place).append('A player is sit, meaning he participates in the game.');
            $(place).append('<hr>');
        }

        var game_id = 100;
        var player_serial = 200;
        var packets = [
{ type: 'PacketPokerTable', id: game_id },
{ type: 'PacketPokerPlayerArrive', seat: 0, serial: player_serial, game_id: game_id, name: 'USER' },
{ type: 'PacketPokerSit', serial: player_serial, game_id: game_id },
{ type: 'PacketPokerPlayerChips', serial: player_serial, game_id: game_id, money: 200, bet: 0 }
                       ];
        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };
        var server = $.jpoker.getServer('url');
        server.spawnTable = function(server, packet) {
	    $(place).jpoker('table', 'url', game_id, 'ONE');
	};
        server.sendPacket('ping');
};

function jpoker_52_inPosition(place) {
        setUp();
        if(explain) {
            $(place).append('A player is in position, meaning he participates in the game and must act. This is associated with a sound notification.');
            $(place).append('<hr>');
        }

        var game_id = 100;
        var player_serial = 200;
        var packets = [
{ type: 'PacketPokerTable', id: game_id },
{ type: 'PacketPokerPlayerArrive', seat: 0, serial: player_serial, game_id: game_id, name: 'USER' },
{ type: 'PacketPokerSit', serial: player_serial, game_id: game_id },
{ type: 'PacketPokerPlayerChips', serial: player_serial, game_id: game_id, money: 200, bet: 0 },
{ type: 'PacketPokerPosition', serial: player_serial, game_id: game_id }
                       ];
        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };
        var server = $.jpoker.getServer('url');
        server.spawnTable = function(server, packet) {
	    $(place).jpoker('table', 'url', game_id, 'ONE');
	};
        server.sendPacket('ping');
};

function jpoker_60_text(place) {
        setUp();
        $('#text').show();
}
