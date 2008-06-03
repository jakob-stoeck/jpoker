/***
|''Name:''|skin|
|''Description:''||
|''Author:''|Loic Dachary (loic@dachary.org)|
|''Source:''|http://jspoker.pokersource.info/jpoker/skin.html#skin.js|
|''Code Repository:''|http://upstream.jspoker.pokersource.info/|
|''Version:''|1.0|
|''Date:''|May 5, 2008|
|''License:''|[[GNU GPLv3+|http://gnu.org/licenses/gpl.txt]]|
|''~CoreVersion:''|2.3.0|
***/
//{{{

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

config.options.chkSinglePagePermalink = false;

function setUp() {
    $.jpoker.verbose = 1;

    $('#jpokerCopyright').dialog('destroy');
    $('#jpokerDialog').dialog('destroy').remove();
    $('.jpokerLogin').remove();
    $('.jpokerTableList').remove();
    $('.jpokerServerStatus').remove();

    $.jpoker.uninit();
    //
    // disable ping logic by setting a very large frequency
    ///
    $.jpoker.serverCreate({ url: 'url', pingFrequency: 20000000 });
};

config.macros.jpoker_01_copyright = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        $.jpoker.copyright();
    }
};

config.macros.jpokerLogin = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        $(place).jpoker('login', config.jpoker.restURL);
    }
};

config.macros.jpokerServerStatus = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        $(place).jpoker('serverStatus', config.jpoker.restURL);
    }
};

config.macros.jpokerTableList = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        $(place).jpoker('tableList', config.jpoker.restURL);
    }
};

config.macros.jpoker_02_join = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('A player just arrived at the table, he is sit out and has no money in front of him.');
        $(place).append('The player name can be 50 characters at most.');
        $(place).append('<hr>');

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
        $(place).jpoker('table', 'url', game_id, 'ONE');
    }
};

config.macros.jpoker_03_joinBuyIn = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('A player arrived at the table, he is sit out he brings money at the table.');
        $(place).append('<hr>');

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
        $(place).jpoker('table', 'url', game_id, 'ONE');
    }
};

config.macros.jpoker_03_playerBet = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('A player is sit, with money at the table and a bet.');
        $(place).append('<hr>');

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
        $(place).jpoker('table', 'url', game_id, 'ONE');
    }
};

config.macros.jpoker_04_playerInPosition = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('The player username0 is to act / is in position.');
        $(place).append('<hr>');

        var game_id = 100;
        var player_serial = 200;
        var packets = [
{ type: 'PacketPokerTable', id: game_id }
                       ];
        for(var i = 0; i < 10; i++) {
            packets.push({ type: 'PacketPokerPlayerArrive', serial: player_serial + i, game_id: game_id, seat: i, name: 'username' + i });
            packets.push({ type: 'PacketPokerSit', serial: player_serial + i, game_id: game_id });
        }
        packets.push({ type: 'PacketPokerPosition', serial: player_serial, game_id: game_id });

        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };
        $(place).jpoker('table', 'url', game_id, 'ONE');
    }
};

config.macros.jpoker_05_selfPlayer = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('The logged in player is sit at the table, buy in dialog shows.');
        $(place).append('<hr>');

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
        $(place).jpoker('table', 'url', game_id, 'ONE');
    }
};

config.macros.jpoker_06_selfInPosition = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('The logged in player is in position.');
        $(place).append('<hr>');

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
        server.sendPacket('ping');
        server.registerHandler(0, function(server, dummy, packet) {
                if(packet.type == 'two') {
                    $(place).jpoker('table', 'url', game_id, 'ONE');
                } else if(packet.type == 'three') {
                    server.notifyUpdate();
                    return false;
                }
                return true;
            });
        
    }
};

config.macros.jpoker_07_joining = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('A request to join the table was sent to the poker server and the HTML element where the table is going to be displayed has been created, with a message showing the table description is expected to arrive from the server.');
        $(place).append('<hr>');

        var game_id = 100;
        $(place).jpoker('table', 'url', game_id, 'ONE');
    }
};

config.macros.jpoker_08_all = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('All community cards and all pots are displayed.');
        $(place).append('<hr>');

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
        $(place).jpoker('table', 'url', game_id, 'ONE');
    }
};

config.macros.jpoker_09_dialog = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('Dialog box used for various game messages and notifications.');
        $(place).append('<hr>');

        $.jpoker.dialog('Dialog box used for various game messages and notifications.');
    }
};

config.macros.jpoker_20_login = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('Player is logged out.');
        $(place).append('<hr>');

        $(place).jpoker('login', 'url');
        $("#name", place).attr('value', 'username');
        $("#password", place).attr('value', 'randompassword');
    }
};

config.macros.jpoker_21_loginProgress = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('Login request was sent, waiting for answer.');
        $(place).append('<hr>');

        var server = $.jpoker.getServer('url');

        $(place).jpoker('login', 'url');
        $("#name", place).attr('value', 'username');
        $("#password", place).attr('value', 'randompassword');
        server.login = function() {};
        $("#login", place).triggerKeypress("13");

        
    }
};

config.macros.jpoker_22_logout = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('User is logged in, one choice only : logout.');
        $(place).append('<hr>');

        var server = $.jpoker.getServer('url');
        server.serial = 1;

        $(place).jpoker('login', 'url');
    }
};

config.macros.jpoker_30_statusDisconnected = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('disconnected from server.');
        $(place).append('<hr>');

        $(place).jpoker('serverStatus', 'url');
    }
};

config.macros.jpoker_31_connectedTables = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('connected to server, with tables and no players.');
        $(place).append('<hr>');

        var server = $.jpoker.getServer('url');

        server.connectionState = 'connected';
        server.tablesCount = 10;
        $(place).jpoker('serverStatus', 'url');
    }
};

config.macros.jpoker_32_connectedTablesPlayers = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('connected to server, with tables and players.');
        $(place).append('<hr>');

        var server = $.jpoker.getServer('url');

        server.connectionState = 'connected';
        server.tablesCount = 10;
        server.playersCount = 23;
        $(place).jpoker('serverStatus', 'url');
    }
};

config.macros.jpoker_40_tableList = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        setUp();
        $(place).append('List of poker tables available on the server.');
        $(place).append('<hr>');

        var packets = [ {"players": 4, "type": "PacketPokerTableList", "packets": [{"observers": 1, "name": "One", "percent_flop" : 98, "average_pot": 100, "seats": 10, "variant": "holdem", "hands_per_hour": 220, "betting_structure": "2-4-limit", "currency_serial": 1, "muck_timeout": 5, "players": 4, "waiting": 0, "skin": "default", "id": 100, "type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Two", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 101,"type": "PacketPokerTable", "player_timeout": 60}, {"observers": 0, "name": "Three", "percent_flop": 0, "average_pot": 0, "seats": 10, "variant": "holdem", "hands_per_hour": 0, "betting_structure": "10-20-pot-limit", "currency_serial": 1, "muck_timeout": 5, "players": 0, "waiting": 0, "skin": "default", "id": 102,"type": "PacketPokerTable", "player_timeout": 60}]} ];

        ActiveXObject.prototype.server = {
            outgoing: JSON.stringify(packets),
            handle: function(packet) { }
        };
        var server = $.jpoker.getServer('url');

        $(place).jpoker('tableList', 'url');
    }
};

//Local Variables:
//compile-command: " ( cd ../.. ; OFFLINE=yes make skin_tests cook ) ; ( cd .. ; x-www-browser skin.html )"
//End:
//}}}
//!END-PLUGIN-CODE
// %/
