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

//Local Variables:
//compile-command: " ( cd ../.. ; OFFLINE=yes make skin_tests cook ) ; ( cd .. ; x-www-browser skin.html )"
//End:
//}}}
//!END-PLUGIN-CODE
// %/
