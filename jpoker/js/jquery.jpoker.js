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

(function($) {

    if(!String.prototype.supplant) {
        //
        // Douglas Crockford douglas@crockford.com snippet
        //
        String.prototype.supplant = function (o) {
            return this.replace(/{([^{}]*)}/g,
                                function (a, b) {
                                    var r = o[b];
                                    return typeof r === 'string' || typeof r === 'number' ? r : a;
                                }
                                );
        };
    }

    $.fn.jpoker = function() {
        var args = Array.prototype.slice.call(arguments);
        var name = args.shift();
        $.jpoker.plugins[name].apply(this, args);
    };

    $.jpoker = {

        packetName2Type: { NONE: 0, STRING: 1, INT: 2, ERROR: 3, ACK: 4, PING: 5, SERIAL: 6, QUIT: 7, AUTH_OK: 8, AUTH_REFUSED: 9, LOGIN: 10, AUTH_REQUEST: 11, LIST: 12, LOGOUT: 13, BOOTSTRAP: 14, PROTOCOL_ERROR: 15, MESSAGE: 16, POKER_SEATS: 50, POKER_ID: 51, POKER_MESSAGE: 52, ERROR: 53, POKER_POSITION: 54, POKER_INT: 55, POKER_BET: 56, POKER_FOLD: 57, POKER_STATE: 58, POKER_WIN: 59, POKER_CARDS: 60, POKER_PLAYER_CARDS: 61, POKER_BOARD_CARDS: 62, POKER_CHIPS: 63, POKER_PLAYER_CHIPS: 64, POKER_CHECK: 65, POKER_START: 66, POKER_IN_GAME: 67, POKER_CALL: 68, POKER_RAISE: 69, POKER_DEALER: 70, POKER_TABLE_JOIN: 71, POKER_TABLE_SELECT: 72, POKER_TABLE: 73, POKER_TABLE_LIST: 74, POKER_SIT: 75, POKER_TABLE_DESTROY: 76, POKER_TIMEOUT_WARNING: 77, POKER_TIMEOUT_NOTICE: 78, POKER_SEAT: 79, POKER_TABLE_MOVE: 80, POKER_PLAYER_LEAVE: 81, POKER_SIT_OUT: 82, POKER_TABLE_QUIT: 83, POKER_BUY_IN: 84, POKER_REBUY: 85, POKER_CHAT: 86, POKER_PLAYER_INFO: 87, POKER_PLAYER_ARRIVE: 88, POKER_HAND_SELECT: 89, POKER_HAND_LIST: 90, POKER_HAND_SELECT_ALL: 91, POKER_USER_INFO: 92, POKER_GET_USER_INFO: 93, POKER_ANTE: 94, POKER_BLIND: 95, POKER_WAIT_BIG_BLIND: 96, POKER_AUTO_BLIND_ANTE: 97, POKER_NOAUTO_BLIND_ANTE: 98, POKER_CANCELED: 99, POKER_BLIND_REQUEST: 100, POKER_ANTE_REQUEST: 101, POKER_AUTO_FOLD: 102, POKER_WAIT_FOR: 103, POKER_STREAM_MODE: 104, POKER_BATCH_MODE: 105, POKER_LOOK_CARDS: 106, POKER_TABLE_REQUEST_PLAYERS_LIST: 107, POKER_PLAYERS_LIST: 108, POKER_PERSONAL_INFO: 109, POKER_GET_PERSONAL_INFO: 110, POKER_TOURNEY_SELECT: 111, POKER_TOURNEY: 112, POKER_TOURNEY_INFO: 113, POKER_TOURNEY_LIST: 114, POKER_TOURNEY_REQUEST_PLAYERS_LIST: 115, POKER_TOURNEY_REGISTER: 116, POKER_TOURNEY_UNREGISTER: 117, POKER_TOURNEY_PLAYERS_LIST: 118, POKER_HAND_HISTORY: 119, POKER_SET_ACCOUNT: 120, POKER_CREATE_ACCOUNT: 121, POKER_PLAYER_SELF: 122, POKER_GET_PLAYER_INFO: 123, POKER_ROLES: 124, POKER_SET_ROLE: 125, POKER_READY_TO_PLAY: 126, POKER_PROCESSING_HAND: 127, POKER_MUCK_REQUEST: 128, POKER_AUTO_MUCK: 129, POKER_MUCK_ACCEPT: 130, POKER_MUCK_DENY: 131, POKER_CASH_IN: 132, POKER_CASH_OUT: 133, POKER_CASH_OUT_COMMIT: 134, POKER_CASH_QUERY: 135, POKER_RAKE: 136, POKER_TOURNEY_RANK: 137, POKER_PLAYER_IMAGE: 138, POKER_GET_PLAYER_IMAGE: 139, POKER_HAND_REPLAY: 140, POKER_GAME_MESSAGE: 141, POKER_EXPLAIN: 142, POKER_STATS_QUERY: 143, POKER_STATS: 144, PACKET_POKER_BEST_CARDS: 170, PACKET_POKER_POT_CHIPS: 171, PACKET_POKER_CLIENT_ACTION: 172, PACKET_POKER_BET_LIMIT: 173, POKER_SIT_REQUEST: 174, POKER_PLAYER_NO_CARDS: 175, PACKET_POKER_CHIPS_PLAYER2BET: 176, PACKET_POKER_CHIPS_BET2POT: 177, PACKET_POKER_CHIPS_POT2PLAYER: 178, PACKET_POKER_CHIPS_POT_MERGE: 179, POKER_CHIPS_POT_RESET: 180, POKER_CHIPS_BET2PLAYER: 181, POKER_END_ROUND: 182, PACKET_POKER_DISPLAY_NODE: 183, PACKET_POKER_DEAL_CARDS: 184, POKER_CHAT_HISTORY: 185, POKER_DISPLAY_CARD: 186, POKER_SELF_IN_POSITION: 187, POKER_SELF_LOST_POSITION: 188, POKER_HIGHEST_BET_INCREASE: 189, POKER_PLAYER_WIN: 190, POKER_ANIMATION_PLAYER_NOISE: 191, POKER_ANIMATION_PLAYER_FOLD: 192, POKER_ANIMATION_PLAYER_BET: 193, POKER_ANIMATION_PLAYER_CHIPS: 194, POKER_ANIMATION_DEALER_CHANGE: 195, POKER_ANIMATION_DEALER_BUTTON: 196, POKER_BEGIN_ROUND: 197, POKER_CURRENT_GAMES: 198, POKER_END_ROUND_LAST: 199, POKER_PYTHON_ANIMATION: 200, POKER_SIT_OUT_NEXT_TURN: 201, POKER_RENDERER_STATE: 202, POKER_CHAT_WORD: 203, POKER_SHOWDOWN: 204, POKER_CLIENT_PLAYER_CHIPS: 205, POKER_INTERFACE_COMMAND: 206, POKER_PLAYER_ME_LOOK_CARDS: 207, POKER_PLAYER_ME_IN_FIRST_PERSON: 208, POKER_ALLIN_SHOWDOWN: 209 },

        verbose: 0,

        copyright: function() {
            var copyright = $('<div id=\'jpokerCopyright\'><div class=\'jpokerAuthors\'><div><span>Copyright 2008 </span><a href=\'mailto:loic@dachary.org\'>Loic Dachary</a></div><div><span class=\'jpokerClick\'>Copyright 2008 </span><a href=\'mailto:proppy@aminche.com\'>Johan Euphrosine</a></div></div><div class=\'jpokerExplain\'>jpoker runs on this web browser and is Free Software. You may use jpoker to run a business without asking the authors permissions. You may give a copy to your friends. However, the authors do not want jpoker to be used with proprietary software.</div><div class=\'jpokerLicense\'>This program is free software: you can redistribute it and/or modify it under the terms of the <a href=\'http://www.fsf.org/licensing/licenses/gpl.txt\'>GNU General Public License</a> as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.</div> <div class=\'jpokerFullCopyright\'>Read the full <a href=\'http://jspoker.pokersource.info/jpoker/#Copyright\'>copyright information page.</a></div><div class=\'jpokerDownload\'>Download <a href=\'http://upstream.jspoker.pokersource.info/file/tip/jpoker/js/jquery.jpoker.js\'>jpoker sources.</a></div><div class=\'jpokerDismiss\'>Dismiss</div></div>').dialog({ width: 400, height: 400, resizable: false });
            var close = function() { copyright.dialog('destroy'); };
            window.setTimeout(close, 10000);
            copyright.click(close);
            return copyright;
        },

        serial: (new Date()).getTime(),

        servers: {},

        url2hashCache: {},

        uninit: function() {
            $.each(this.servers,
                   function(key, value) {
                       value.uninit();
                   });
            this.servers = {};
        },

        now: function() { return (new Date()).getTime(); },

        uid: function() { return 'jpoker' + $.jpoker.serial++ ; },

        message: function(str) {
            if(window.console) { window.console.log(str); }
        },

        dialog: function(content) {
            var message = $('#jpokerDialog');
            if(message.size() != 1) {
                $('body').append('<div id=\'jpokerDialog\' class=\'flora\' title=\'jpoker message\' />');
                message = $('#jpokerDialog');
                message.dialog({
                        autoOpen: false,
                            dialog: true
                            });
            }
            message.html(content).dialog('open');
        },

        error: function(reason) {
            this.errorHandler(reason);
            this.uninit();
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
            this.servers[url].uninit();
            delete this.servers[url];
        },

        url2server: function(options) {
	    if(!(options.url in this.servers)) {
		this.serverCreate(options);
	    }
	    return this.servers[options.url];
	},

        getServer: function(url) {
            return this.servers[url];
        },

        getTable: function(url, game_id) {
            var server = jpoker.servers[url];
            if(!server) {
                return undefined;
            } else {
                return server.tables[game_id];
            }
        },

        getPlayer: function(url, game_id, serial) {
            var server = jpoker.servers[url];
            if(!server) {
                return undefined;
            }
            var table = server.tables[game_id];
            if(!table) {
                return undefined;
            }
            return table.serial2player[serial];
        },

        getServerTablePlayer: function(url, game_id, serial) {
            var server = jpoker.servers[url];
            if(!server) {
                return undefined;
            }
            var table = server.tables[game_id];
            if(!table) {
                return undefined;
            }
            if(!table.serial2player[serial]) {
                return undefined;
            }
            return { server: server,
                     table: table,
                     player: table.serial2player[serial]
                    };
        },

        url2hash: function(url) {
            if(!(url in this.url2hashCache)) {
                this.url2hashCache[url] = jpoker.Crypto.hexSha1Str(url);
            }
            return this.url2hashCache[url];
        }
        
    };

    var jpoker = $.jpoker;

    //--
    //-- Crypto functions and associated conversion routines
    //--

    //
    // Copyright (c) UnaMesa Association 2004-2007
    // 
    // Licensed under Modified BSD
    //

    // Crypto namespace
    jpoker.Crypto = function() {};

    // Convert a string to an array of big-endian 32-bit words
    jpoker.Crypto.strToBe32s = function(str)
        {
            var be = Array();
            var len = Math.floor(str.length/4);
            var i, j;
            for(i=0, j=0; i<len; i++, j+=4) {
		be[i] = ((str.charCodeAt(j)&0xff) << 24)|((str.charCodeAt(j+1)&0xff) << 16)|((str.charCodeAt(j+2)&0xff) << 8)|(str.charCodeAt(j+3)&0xff);
            }
            while (j<str.length) {
		be[j>>2] |= (str.charCodeAt(j)&0xff)<<(24-(j*8)%32);
		j++;
            }
            return be;
        };

    // Convert an array of big-endian 32-bit words to a string
    jpoker.Crypto.be32sToStr = function(be)
        {
            var str = '';
            for(var i=0;i<be.length*32;i+=8) {
		str += String.fromCharCode((be[i>>5]>>>(24-i%32)) & 0xff);
            }
            return str;
        };

    // Convert an array of big-endian 32-bit words to a hex string
    jpoker.Crypto.be32sToHex = function(be)
        {
            var hex = '0123456789ABCDEF';
            var str = '';
            for(var i=0;i<be.length*4;i++) {
		str += hex.charAt((be[i>>2]>>((3-i%4)*8+4))&0xF) + hex.charAt((be[i>>2]>>((3-i%4)*8))&0xF);
            }
            return str;
        };

    // Return, in hex, the SHA-1 hash of a string
    jpoker.Crypto.hexSha1Str = function(str)
        {
            return jpoker.Crypto.be32sToHex(jpoker.Crypto.sha1Str(str));
        };

    // Return the SHA-1 hash of a string
    jpoker.Crypto.sha1Str = function(str)
        {
            return jpoker.Crypto.sha1(jpoker.Crypto.strToBe32s(str),str.length);
        };

    // Calculate the SHA-1 hash of an array of blen bytes of big-endian 32-bit words
    jpoker.Crypto.sha1 = function(x,blen)
        {
            // Add 32-bit integers, wrapping at 32 bits
            add32 = function(a,b)
            {
		var lsw = (a&0xFFFF)+(b&0xFFFF);
		var msw = (a>>16)+(b>>16)+(lsw>>16);
		return (msw<<16)|(lsw&0xFFFF);
            };
            // Add five 32-bit integers, wrapping at 32 bits
            add32x5 = function(a,b,c,d,e)
            {
		var lsw = (a&0xFFFF)+(b&0xFFFF)+(c&0xFFFF)+(d&0xFFFF)+(e&0xFFFF);
		var msw = (a>>16)+(b>>16)+(c>>16)+(d>>16)+(e>>16)+(lsw>>16);
		return (msw<<16)|(lsw&0xFFFF);
            };
            // Bitwise rotate left a 32-bit integer by 1 bit
            rol32 = function(n)
            {
		return (n>>>31)|(n<<1);
            };

            var len = blen*8;
            // Append padding so length in bits is 448 mod 512
            x[len>>5] |= 0x80 << (24-len%32);
            // Append length
            x[((len+64>>9)<<4)+15] = len;
            var w = Array(80);

            var k1 = 0x5A827999;
            var k2 = 0x6ED9EBA1;
            var k3 = 0x8F1BBCDC;
            var k4 = 0xCA62C1D6;

            var h0 = 0x67452301;
            var h1 = 0xEFCDAB89;
            var h2 = 0x98BADCFE;
            var h3 = 0x10325476;
            var h4 = 0xC3D2E1F0;

            for(var i=0;i<x.length;i+=16) {
		var j,t;
		var a = h0;
		var b = h1;
		var c = h2;
		var d = h3;
		var e = h4;
		for(j = 0;j<16;j++) {
                    w[j] = x[i+j];
                    t = add32x5(e,(a>>>27)|(a<<5),d^(b&(c^d)),w[j],k1);
                    e=d; d=c; c=(b>>>2)|(b<<30); b=a; a = t;
		}
		for(j=16;j<20;j++) {
                    w[j] = rol32(w[j-3]^w[j-8]^w[j-14]^w[j-16]);
                    t = add32x5(e,(a>>>27)|(a<<5),d^(b&(c^d)),w[j],k1);
                    e=d; d=c; c=(b>>>2)|(b<<30); b=a; a = t;
		}
		for(j=20;j<40;j++) {
                    w[j] = rol32(w[j-3]^w[j-8]^w[j-14]^w[j-16]);
                    t = add32x5(e,(a>>>27)|(a<<5),b^c^d,w[j],k2);
                    e=d; d=c; c=(b>>>2)|(b<<30); b=a; a = t;
		}
		for(j=40;j<60;j++) {
                    w[j] = rol32(w[j-3]^w[j-8]^w[j-14]^w[j-16]);
                    t = add32x5(e,(a>>>27)|(a<<5),(b&c)|(d&(b|c)),w[j],k3);
                    e=d; d=c; c=(b>>>2)|(b<<30); b=a; a = t;
		}
		for(j=60;j<80;j++) {
                    w[j] = rol32(w[j-3]^w[j-8]^w[j-14]^w[j-16]);
                    t = add32x5(e,(a>>>27)|(a<<5),b^c^d,w[j],k4);
                    e=d; d=c; c=(b>>>2)|(b<<30); b=a; a = t;
		}

		h0 = add32(h0,a);
		h1 = add32(h1,b);
		h2 = add32(h2,c);
		h3 = add32(h3,d);
		h4 = add32(h4,e);
            }
            return Array(h0,h1,h2,h3,h4);
        };

    //
    // chips helpers
    //
    jpoker.chips = {
        epsilon: 0.001,

        chips2value: function(chips) {
            var value = 0;
            for(var i = 0; i < chips.length; i += 2) {
                value += ( chips[i] / 100 ) * chips[i + 1];
            }
            return value;
        },

        SHORT: function(chips) {
            if(chips < 10) {
                return this.LONG(chips);
            } 
            var unit = [ 'G', 'M', 'K', '' ];
            for(var magnitude = 1000000000; magnitude > 0; magnitude /= 1000) {
                if(chips >= magnitude) {
                    if(chips / magnitude < 10) {
                        chips = chips / ( magnitude / 10 );
                        return parseInt(chips / 10, 10) + '.' + parseInt(chips % 10, 10) + unit[0];
                    } else {
                        return parseInt(chips / magnitude, 10) + unit[0];
                    }
                }
                unit.shift();
            }
        },

        LONG: function(chips) {
            var chips_int = parseInt(chips, 10);
            var chips_fraction = parseInt(chips * 100, 10) % 100;
            if(chips_fraction === 0) {
                return chips_int;
            } else if(chips_fraction % 10) {
                if(chips_fraction < 10) {
                    return chips_int + '.0' + chips_fraction;
                } else {
                    return chips_int + '.' + chips_fraction;
                }
            } else {
                return chips_int + '.' + parseInt(chips_fraction / 10, 10);
            }
        }

    };

    //
    // cards helpers
    //
    jpoker.cards = {
        // Ad replaced with Ax to escape adblock 
        card2string: [ '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h', 'Th', 'Jh', 'Qh', 'Kh', 'Ah', '2d', '3d', '4d', '5d', '6d', '7d', '8d', '9d', 'Td', 'Jd', 'Qd', 'Kd', 'Ax', '2c', '3c', '4c', '5c', '6c', '7c', '8c', '9c', 'Tc', 'Jc', 'Qc', 'Kc', 'Ac', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', 'Ts', 'Js', 'Qs', 'Ks', 'As' ]
    };

    //
    // Abstract prototype for all objects that
    // call destroy and update callbacks
    //
    jpoker.watchable = function(options) {
        $.extend(this, jpoker.watchable.defaults, options);
        this.init();
    };

    jpoker.watchable.defaults = {
    };

    jpoker.watchable.prototype = {

        init: function() {
            this.setCallbacks();
        },

        uninit: function() {
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

        register: function(what, callback, callback_data, signature) {
            if($.inArray(callback, this.callbacks[what]) < 0) {
                var wrapper = function($this, data) {
                    return callback($this, data, callback_data);
                };
                wrapper.signature = signature || callback;
                this.callbacks[what].push(wrapper);
            }
        },

        registerUpdate: function(callback, callback_data, signature) { this.register('update', callback, callback_data, signature); },
        registerDestroy: function(callback, callback_data, signature) { this.register('destroy', callback, callback_data, signature); },

        unregister: function(what, signature) {
            this.callbacks[what] = $.grep(this.callbacks[what],
                                          function(e, i) { return e.signature != signature; });
        },

        unregisterUpdate: function(callback) { this.unregister('update', callback); },
        unregisterDestroy: function(callback) { this.unregister('destroy', callback); }

    };

    //
    // Abstract prototype to manage the communication with a single poker server
    //
    jpoker.connection = function(options) {
        $.extend(this, jpoker.connection.defaults, options);
        this.init();
    };

    jpoker.connection.defaults = $.extend({
            mode: 'queue',
            url: '',
            async: true,
            lagmax: 60,
            pollFrequency:  100,
            pingFrequency: 5000,
            timeout: 30000,
            clearTimeout: function(id) { return window.clearTimeout(id); },
            setTimeout: function(cb, delay) { return window.setTimeout(cb, delay); },
            ajax: function(o) { return jQuery.ajax(o); }
        }, jpoker.watchable.defaults);

    jpoker.connection.prototype = $.extend({}, jpoker.watchable.prototype, {

            blocked: false,

            session: 'session=clear',

            state: 'disconnected',

            lag: 0,

            high: ['PacketPokerChat', 'PacketPokerMessage', 'PacketPokerGameMessage'],

            incomingTimer: -1,

            pingTimer: -1,

            init: function() {
                jpoker.watchable.prototype.init.call(this);
                this.handlers = {};
                this.queues = {};
                this.delays = {};
                this.reset();
            },

            uninit: function() {
                this.blocked = true;
                jpoker.watchable.prototype.uninit.call(this);
                this.reset();
            },

            clearSession: function() {
                this.session = 'session=clear&name=' + jpoker.url2hash(this.url);
            },

            ensureSession: function() {
                if(this.session.indexOf('session=clear') === 0) {
                    this.session = 'session=yes&name=' + jpoker.url2hash(this.url);
                    this.sendPacket({ 'type': 'PacketPokerExplain',
                                      'value': 0xFF });
                }
            },

            reset: function() {
                this.clearTimeout(this.pingTimer);
                this.pingTimer = -1;
                this.clearTimeout(this.incomingTimer);
                this.incomingTimer = -1;
                // empty the outgoing queue
                jQuery([$.ajax_queue]).queue('ajax', []);
                // empty the incoming queue
                this.queues = {};
                this.delays = {};
                this.clearSession();
            },

            error: function(reason) {
                this.reset();
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

            //
            // Call 'handler' for each packet sent to the poker game 'id'
            // If id == 0, 'handler' is called for each packet not associated with
            // a poker game.
            //
            // Prototype: handler(server, id, packet) returns a boolean
            //
            // server: the $.jpoker.server instance connected to the server from
            //        which the packet was received
            // id: is 0 if the packet is not associated to a poker game or the serial
            //     number of the poker game
            // packet: is the packet received from the server
            // 
            // If the return value is false, the handler is discarded and will not
            // be called again. If the return value is true, the handler is retained
            // and will be called when the next packet matching the 'id' paramater
            // arrives.
            //
            // If the handler throws an exception, the server will be killed and
            // all communications interrupted. The handler must *not* call server.error.
            //
            registerHandler: function(id, handler) {
                if(!(id in this.handlers)) {
                    this.handlers[id] = [];
                }
                this.handlers[id].push(handler);
            },

            unregisterHandler: function(id, handler) {
                if(id in this.handlers) {
                    this.handlers[id] = $.grep(this.handlers[id],
                                               function(e, i) { return e != handler; });
                    if(this.handlers[id].length <= 0) {
                        delete this.handlers[id];
                    }
                }
            },

            handle: function(id, packet) {
                if(jpoker.verbose > 1) {
                    jpoker.message('connection handle ' + id + ': ' + JSON.stringify(packet));
                }
                if(id in this.handlers) {
                    delete packet.time__;
                    var $this = this;
                    this.handlers[id] = $.grep(this.handlers[id], function(element, index) {
                            try {
                                return element($this, id, packet);
                            } catch(e) {
                                $this.error(e);
                                return false; // error will throw anyways
                            }
                        });
                    return true;
                }
                return false;
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
                var json_data = JSON.stringify(packet);
                if(jpoker.verbose > 0) {
                    jpoker.message('sendPacket ' + json_data);
                }
                var args = {
                    async: this.async,
                    data: json_data,
                    mode: this.mode,
                    timeout: this.timeout,
                    url: this.url + '?' + this.session,
                    type: 'POST',
                    dataType: 'json',
                    global: false, // do not fire global events
                    success: function(data, status) {
                        if($this.state != 'connected') {
                            $this.setState('connected');
                        }
                        $this.queueIncoming(data);
                    },
                    error: function(xhr, status, error) {
                        if(status == 'timeout') {
                            $this.setState('disconnected');
                            $this.reset();
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
                if(jQuery([$.ajax_queue]).queue('ajax').length <= 0) {
                    this.sendPacket({ type: 'PacketPing' });
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
                        if('session' in packet) {
                            delete packet.session;
                        }
                        packet.time__ = jpoker.now();
                        var id;
                        if('game_id' in packet) {
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
                        if(jpoker.verbose > 1) {
                            jpoker.message('queueIncoming ' + JSON.stringify(packet));
                        }
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
                                    if(this.handle(id, queue.packets[0])) {
                                        queue.packets.shift();
                                    }
                                } else {
                                    queue.delay = delay;
                                }
                            } else if(jpoker.verbose > 0) {
                                jpoker.message(_("wait for {delay}s for queue {id}").supplant({ 'delay': queue.delay / 1000.0, 'id': id}));
                            }
                        }
                        //
                        // get rid of queues with no associated delay AND no pending packets.
                        // this.queues may be undefined if a handler destroyed the object
                        //
                        if(id in this.queues) {
                            queue = this.queues[id];
                            if(queue.high.packets.length <= 0 && queue.low.packets.length <= 0) {
                                if(queue.high.delay <= now && queue.low.delay <= now) {
                                    delete this.queues[id];
                                }
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
        this.init();
    };

    jpoker.server.defaults = $.extend({
	    playersCount: null,
	    tablesCount: null,
            tableRowClick: function(server, packet) {},
            setInterval: function(cb, delay) { return window.setInterval(cb, delay); },
            clearInterval: function(id) { return window.clearInterval(id); }
        }, jpoker.connection.defaults);

    jpoker.server.prototype = $.extend({}, jpoker.connection.prototype, {
            init: function() {
                jpoker.connection.prototype.init.call(this);
                this.tables = {};
                this.tableLists = {};
                this.timers = {};
                this.serial = 0;
                this.userInfo = {};
                this.registerHandler(0, this.handler);
            },

            uninit: function() {
                this.clearTimers();
                this.unregisterHandler(0, this.handler);
                jpoker.connection.prototype.uninit.call(this);
            },

            clearTimers: function() {
                var $this = this;
                $.each(this.timers, function(key, value) {
                        $this.clearInterval(value.timer);
                    });
                this.timers = {};
            },

            handler: function(server, game_id, packet) {
                if(jpoker.verbose) {
                    jpoker.message('server.handler ' + JSON.stringify(packet));
                }

                switch(packet.type) {

                case 'PacketPokerTable':
                if(packet.id in server.tables) {
                    throw 'table id ' + packet.id + ' matches an existing table';
                }
                server.tables[packet.id] = new jpoker.table(server, packet);
                server.notifyUpdate(packet);
                break;

                case 'PacketPokerMessage':
                case 'PacketPokerGameMessage':
                jpoker.dialog(packet.string);
                break;

                case 'PacketSerial':
                server.serial = packet.serial;
                var id;
                for(id in server.tables) {
                    server.tables[id].notifyUpdate(packet);
                }
                break;

                case 'PacketPokerUserInfo':
                server.userInfo = packet;
                for(id in server.tables) {
                    packet.game_id = id;
                    server.tables[id].handler(server, game_id, packet);
                    server.tables[id].notifyUpdate(packet);
                }
                delete packet.game_id;
                break;

                }

                return true;
            },

            refresh: function(tag, request, handler, options) {
                var timer = jpoker.refresh(this, request, handler, options);
                if(timer) {
                    if(tag in this.timers) {
                        this.clearInterval(this.timers[tag].timer);
                    } else {
                        this.timers[tag] = {};
                    }
                    this.timers[tag].timer = timer;
                }
                return timer;
            },

            //
            // tables lists
            //
            refreshTables: function(string, options) {

                if(!(string in this.tables)) {
                    this.tableLists[string] = {};
                }

                var request = function(server) {
                    server.sendPacket({
                            type: 'PacketPokerTableSelect',
                            string: string
                        });
                };

                var handler = function(server, packet) {
                    var info = server.tableLists && server.tableLists[string];
                    if(packet.type == 'PacketPokerTableList') {
                        info.packet = packet;
                        // although the tables/players count is sent with each
                        // table list, it is global to the server
			server.playersCount = packet.players;
			server.tablesCount = packet.tables;
                        server.notifyUpdate(packet);
                    }
                    return true;
                };

                return this.refresh('tableList', request, handler, options);
            },

            //
            // login / logout
            //
            loggedIn: function() {
                return this.serial !== 0;
            },

            login: function(name, password) {
                if(this.serial !== 0) {
                    throw _("{url} attempt to login {name} although serial is {serial} instead of 0").supplant({ 'url': this.url, 'name': name, 'serial': this.serial});
                }
                this.ensureSession();
                this.userInfo.name = name;
                this.sendPacket({
                        type: 'PacketLogin',
                        name: name,
                        password: password
                    });
                this.ping();
                var answer = function(server, game_id, packet) {
                    switch(packet.type) {
                    case 'PacketAuthOk':
                    return true;

                    case 'PacketAuthRefused':
                    jpoker.dialog(_(packet.message) + _(" (login name is {name} )").supplant({ 'name': name }));
                    server.notifyUpdate(packet);
                    return false;

                    case 'PacketError':
                    if(packet.other_type == jpoker.packetName2Type.LOGIN) {
                        jpoker.dialog(_("user {name} is already logged in".supplant({ 'name': name })));
                        server.notifyUpdate(packet);
                        return false;
                    }
                    break;

                    case 'PacketSerial':
                    server.notifyUpdate(packet);
                    server.getUserInfo();
                    return false;

                    }

                    return true;
                };
                this.registerHandler(0, answer);
            },

            logout: function() {
                if(this.serial !== 0) {
                    //
                    // redundant with PacketLogout handler in server to ensure all
                    // notify functions will see serial == 0 regardless of the 
                    // order in which they are called.
                    //
                    this.serial = 0;
                    this.userInfo = {};
                    var packet = { type: 'PacketLogout' };
                    this.sendPacket(packet);
                    this.clearSession();
                    //
                    // LOGOUT IMPLIES ALL TABLES ARE DESTROYED INSTEAD
                    //
                    for(var game_id in this.tables) {
                        this.tables[game_id].notifyUpdate(packet);
                    }
                    this.notifyUpdate(packet);
                }
            },

            getUserInfo: function() {
                this.sendPacket({
                        type: 'PacketPokerGetUserInfo',
                        serial: this.serial });
            },

            tableJoin: function(game_id) {
                this.ensureSession();
                this.sendPacket({ 'type': 'PacketPokerTableJoin',
                                  'game_id': game_id });
                this.ping();
            },

            bankroll: function(currency_serial) {
                var key = 'X' + currency_serial;
                if(this.loggedIn() && key in this.userInfo.money) {
                    return this.userInfo.money[key][0] / 100; // PacketPokerUserInfo for documentation
                }
                return 0;
            }
        });

    //
    // table
    //
    jpoker.table = function(server, packet) {
        $.extend(this, jpoker.table.defaults, packet);
        this.url = server.url;
        this.init();
        server.registerHandler(packet.id, this.handler);
    };

    jpoker.table.defaults = {
    };

    jpoker.table.prototype = $.extend({}, jpoker.watchable.prototype, {
            init: function() {
                jpoker.watchable.prototype.init.call(this);
                this.serial2player = {};
                this.seats = [ null, null, null, null, null, 
                               null, null, null, null, null ];
                this.board = [ null, null, null, null, null ];
                this.pots = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
                this.buyIn = { min: 1000000000, max: 1000000000, best: 1000000000, bankroll: 0 };
            },

            uninit: function() {
                jpoker.watchable.prototype.uninit.call(this);
                $this = this;
                $.each([ 'seats', 'board', 'pots' ], function(index, value) {
                        $.each($this[value], function(index, value) {
                                if(value) {
                                    value.uninit();
                                }
                            });
                    });
            },

            buyInLimits: function() {
                var max = Math.min(this.buyIn.max, this.buyIn.bankroll);
                var min = Math.min(this.buyIn.min, this.buyIn.bankroll);
                var best = Math.min(this.buyIn.best, this.buyIn.bankroll);
                return [ min, best, max ];
            },

            handler: function(server, game_id, packet) {
                if(jpoker.verbose) {
                    jpoker.message('table.handler ' + JSON.stringify(packet));
                }
                
                table = server.tables[packet.game_id];
                var url = server.url;
                var serial = packet.serial;

                switch(packet.type) {

                case 'PacketPokerTableDestroy':
                    delete server.tables[game_id];
                    table.uninit();
                    break;

                case 'PacketPokerPlayerArrive':
                    if(server.loggedIn() && packet.serial == server.serial) {
                        table.serial2player[serial] = new jpoker.playerSelf(server, packet);
                    } else {
                        table.serial2player[serial] = new jpoker.player(server, packet);
                    }
                    table.seats[packet.seat] = serial;
                    table.notifyUpdate(packet);
                    break;

                case 'PacketPokerPlayerLeave':
                    table.notifyUpdate(packet);
                    table.seats[packet.seat] = null;
                    table.serial2player[serial].uninit();
                    delete table.serial2player[serial];
                    break;

                case 'PacketPokerBoardCards':
                    for(var i = 0; i < packet.cards.length; i++) {
                        table.board[i] = packet.cards[i];
                    }
                    for(var j = packet.cards.length; j < table.board.length; j++) {
                        table.board[j] = null;
                    }
                    table.notifyUpdate(packet);
                    break;

                case 'PacketPokerPotChips':
                    table.pots[packet.index] = jpoker.chips.chips2value(packet.bet);
                    table.notifyUpdate(packet);
                    break;

                case 'PacketPokerChipsPotReset':
                    table.pots = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
                    table.notifyUpdate(packet);
                    break;

                case 'PacketPokerDealer':
                case 'PacketPokerPosition':
                    table.notifyUpdate(packet);
                    break;

                case 'PacketPokerBetLimit':
                    table.betLimit = {
                        min: packet.min / 100,
                        max: packet.max / 100,
                        step: packet.step / 100,
                        call: packet.call / 100,
                        allin: packet.allin / 100,
                        pot: packet.pot / 100
                    };
                    break;

                case 'PacketPokerSelfLostPosition': 
                    // use serial for dispatching because the serial of the 
                    // player in position is not used
                    serial = server.serial;
                    packet.serial = serial;
                    break;

                case 'PacketPokerBuyInLimits':
                    table.buyIn = {
                        min: packet.min / 100,
                        max: packet.max / 100,
                        best: packet.best / 100,
                        rebuy_min: packet.rebuy_min / 100
                    };
                    table.buyIn.bankroll = server.bankroll(table.currency_serial);
                    break;

                case 'PacketPokerUserInfo':
                    table.buyIn.bankroll = server.bankroll(table.currency_serial);
                    break;

                case 'PacketPokerChat':
                    table.notifyUpdate(packet);
                    break;
                }

                if(serial in table.serial2player) {
                    table.serial2player[serial].handler(server, game_id, packet);
                }

                return true;
            }
        });

    //
    // player
    //

    jpoker.player = function(server, packet) {
        $.extend(this, jpoker.player.defaults, packet);
        this.url = server.url;
        this.init();
    };

    jpoker.player.defaults = {

    };

    jpoker.player.prototype = $.extend({}, jpoker.watchable.prototype, {
            init: function() {
                jpoker.watchable.prototype.init.call(this);
                this.cards = [ null, null, null, null, null, null, null ];
                this.money = 0;
                this.bet = 0;
                this.sit = false;
            },

            uninit: function() {
                jpoker.watchable.prototype.uninit.call(this);
                this.cards = [];
            },
            
            handler: function(server, game_id, packet) {
                if(jpoker.verbose) {
                    jpoker.message('player.handler ' + JSON.stringify(packet));
                }

                switch(packet.type) {

                case 'PacketPokerPlayerCards':
                for(var i = 0; i < packet.cards.length; i++) {
                    this.cards[i] = packet.cards[i];
                }
                for(var j = packet.cards.length; j < this.cards.length; j++) {
                    this.cards[j] = null;
                }
                this.notifyUpdate(packet);
                break;

                case 'PacketPokerPlayerChips':
                this.money = packet.money / 100;
                this.bet = packet.bet / 100;
                this.notifyUpdate(packet);
                break;

                case 'PacketPokerSit':
                this.sit = true;
                this.notifyUpdate(packet);
                break;

                case 'PacketPokerSitOut':
                this.sit = false;
                this.notifyUpdate(packet);
                break;

                }
            }    

        });

    //
    // player that is logged in
    //

    jpoker.playerSelf = function(server, packet) {
        $.extend(this, jpoker.playerSelf.defaults, packet);
        this.url = server.url;
        this.init();
    };

    jpoker.playerSelf.defaults = {

    };

    jpoker.playerSelf.prototype = $.extend({}, jpoker.player.prototype, {
            init: function() {
                jpoker.player.prototype.init.call(this);
                this.state = 'buyin';
            },

            uninit: function() {
                jpoker.player.prototype.uninit.call(this);
            },
            
            handler: function(server, game_id, packet) {
                jpoker.player.prototype.handler.call(this, server, game_id, packet);

                if(jpoker.verbose) {
                    jpoker.message('playerSelf.handler ' + JSON.stringify(packet));
                }

                switch(packet.type) {
                case 'PacketPokerPlayerChips':
                if(packet.money > 0 && this.state == 'buyin') {
                    this.state = 'playing';
                }
                break;

                case 'PacketPokerSelfLostPosition':
                case 'PacketPokerSelfInPosition':
                this.notifyUpdate(packet);
                break;

                }
            }    

        });
    //
    // Refresh data with the 'handler' function after sending
    // a packet to the 'url' poker server with the 'request' function.
    //
    jpoker.refresh = function(server, request, handler, options) {

        var opts = $.extend({}, this.refresh.defaults, options);

        var waiting = false;

        var timer = 0;

        var url = server.url;

        var callback = function() {
            var server = jpoker.url2server({ url: url }); // check if server still exists when the callback runs
            if(opts.requireSession === false || server.connected()) {
                if(!waiting) {
                    waiting = true;
                    request(server);
                } else if(jpoker.verbose > 0) {
                    jpoker.message('refresh waiting');
                } 
                return true;
            } else {
                opts.clearInterval(timer);
                timer = 0;
                return false;
            }
        };

        if(callback()) {

            if(opts.delay) {
                timer = opts.setInterval(callback, opts.delay);
            }

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
        game_id: 0,
        requireSession: false,

        setInterval: function(cb, delay) { return window.setInterval(cb, delay); },
        clearInterval: function(id) { return window.clearInterval(id); }
    };

    //
    // jQuery plugin container (must only contain jQuery plugins)
    //
    jpoker.plugins = {};

    //
    // tableList
    //
    jpoker.plugins.tableList = function(url, options) {

        var tableList = jpoker.plugins.tableList;
        var opts = $.extend({}, tableList.defaults, options);
        var server = jpoker.url2server({ url: url });

        return this.each(function() {
                var $this = $(this);

                var id = jpoker.uid();

                $this.append('<table class=\'jpokerTableList\' id=\'' + id + '\'></table>');

                var updated = function(server, packet) {
                    var element = document.getElementById(id);
                    if(element) {
                        if(packet && packet.type == 'PacketPokerTableList') {
                            $(element).html(tableList.getHTML(id, packet));
                            for(var i = 0; i < packet.packets.length; i++) {
                                (function(){
                                    var subpacket = packet.packets[i];
                                    $('#' + subpacket.id).click(function() {
                                            var server = jpoker.url2server({ url: url });
                                            server.tableRowClick(server, subpacket);
                                        }).hover(function(){
  						$(this).addClass('hover');
						},function(){
  						$(this).removeClass('hover');
					});
                                })();
                            }
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

    jpoker.plugins.tableList.getHTML = function(id, packet) {
        var t = this.templates;
        var html = [];
        html.push(t.header.supplant({
                        'seats': _("Seats"),
                        'average_pot': _("Average Pot"),
                        'hands_per_hour': _("Hands/Hour"),
                        'percent_flop': _("%Flop"),
                        'players': _("Players"),
                        'observers': _("Observers"),
                        'waiting': _("Waiting"),
                        'player_timeout': _("Timeout"),
                        'currency_serial': _("Currency"),
                        'name': _("Name"),
                        'variant': _("Variant"),
                        'betting_structure': _("Betting Structure"),
                        'skin': _("Skin")
                        }));
        for(var i = 0; i < packet.packets.length; i++) {
            var subpacket = packet.packets[i];
            if(!('game_id' in subpacket)) {
                subpacket.game_id = subpacket.id;
                subpacket.id = subpacket.game_id + id;
                subpacket.average_pot /= 100;
            }
            subpacket['class'] = i%2 ? 'evenRow' : 'oddRow';
            html.push(t.rows.supplant(subpacket));
        }
        html.push(t.footer);
        return html.join('\n');
    };

    jpoker.plugins.tableList.templates = {
        header : '<thead><tr><td>{name}</td><td>{players}</td><td>{seats}</td><td>{betting_structure}</td><td>{average_pot}</td><td>{hands_per_hour}</td><td>{percent_flop}</td></tr></thead><tbody>',
        rows : '<tr class=\'{class}\' id=\'{id}\' title=\'' + _("Click to join the table") + '\'><td>{name}</td><td>{players}</td><td>{seats}</td><td>{betting_structure}</td><td>{average_pot}</td><td>{hands_per_hour}</td><td>{percent_flop}</td></tr>',
        footer : '</tbody>'
    };

    //
    // serverStatus
    //
    jpoker.plugins.serverStatus = function(url, options) {

        var serverStatus = jpoker.plugins.serverStatus;
        var opts = $.extend({}, serverStatus.defaults, options);
        var server = jpoker.url2server({ url: url });

        return this.each(function() {
                var $this = $(this);

                var id = jpoker.uid();

                $this.append('<span class=\'jpokerServerStatus\' id=\'' + id + '\'></span>');

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
	
	if(server.connected()) {
	    html.push(t.connected);
	} else {
	    html.push(t.disconnected.supplant({ 'label': _("disconnected") }));
	}
	if(server.playersCount) {
	    html.push(t.players.supplant({ 'count': server.playersCount, 'players': _("players") }));
	}
	if(server.tablesCount) {
	    html.push(t.tables.supplant({ 'count': server.tablesCount, 'tables': _("tables") }));
	}
        return html.join(' ');
    };

    jpoker.plugins.serverStatus.templates = {
	disconnected: ' {label} ',
	connected: '',
        players: ' {count} {players} ',
        tables: ' {count} {tables} '
    };

    //
    // login
    //
    jpoker.plugins.login = function(url, options) {
 
        var login = jpoker.plugins.login;
        var opts = $.extend({}, jpoker.plugins.login.defaults, options);
        var server = jpoker.url2server({ url: url });

        return this.each(function() {
                var $this = $(this);

                var id = jpoker.uid();

                $this.append('<div class=\'jpokerLogin\' id=\'' + id + '\'></div>');

                var updated = function(server) {
                    var element = document.getElementById(id);
                    if(element) {
			var e = $(element);
                        e.html(login.getHTML(server));
                        if(server.loggedIn()) {
                            $('#logout', element).click(function() {
                                    var server = jpoker.url2server({ url: url });
                                    if(server.loggedIn()) {
                                        server.logout();
                                    }
                                });
                        } else {
                            var login_element = $('#login', element);
                            var action = function() {
                                var name = $('#name', login_element).attr('value');
                                var password = $('#password', login_element).attr('value');
                                if(!name) {
                                    jpoker.dialog(_("the user name must not be empty"));
                                } else if(!password) {
                                    jpoker.dialog(_("the password must not be empty"));
                                } else {
                                    jpoker.url2server({ url: url }).login(name, password);
                                    $('#' + id + ' > #login').html(_("login in progress"));
                                }
                            };
                            $('.jpokerLoginSubmit, .jpokerLoginSignin', login_element).click(action);
                            login_element.keypress(function(e) {
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
	    html.push(t.logout.supplant({ 'logout': _("{logname} logout").supplant({ 'logname': server.userInfo.name }) }));
	} else {
	    html.push(t.login.supplant({ 'login': _("user: "),
                                         'password': _("password: "),
                                         'signin': _("Sign In"),
                                         'go': _("Login")
                    }));
	}
        return html.join('\n');
    };

    jpoker.plugins.login.templates = {
	login: '<table id=\'login\' cellspacing=\'0\' cellpadding=\'10\' class=\'login\'>\n<tbody><tr>\n<td class=\'login_text\'><b>{login}</b></td>\n<td class=\'login_input\'><input type=\'text\' id=\'name\' size=\'10\'/></td>\n</tr>\n<tr>\n<td class=\'login_text\'><b>{password}</b></td>\n<td class=\'login_input\'><input type=\'password\' id=\'password\' size=\'10\'/></td>\n</tr>\n<tr>\n<td class=\'jpokerLoginSubmit\'><input type=\'submit\' value=\'{go}\' /></td>\n<td class=\'jpokerLoginSignin\'><input type=\'submit\' value=\'{signin}\' /></td>\n</tr>\n</tbody></table>',
	logout: '<div id=\'logout\'>{logout}<div>'
    };

    //
    // featured table
    //
    jpoker.plugins.featuredTable = function(url, options) {

        var opts = $.extend({}, jpoker.plugins.featuredTable.defaults, options);
        var server = jpoker.url2server({ url: url });

        var updated = function(server, packet) {
            if(packet && packet.type == 'PacketPokerTableList') {
                var server = jpoker.getServer(url);
                if(server) {
                    var found = null;
                    for(var i = packet.packets.length - 1; i >= 0 ; i--) {
                        var subpacket = packet.packets[i];
                        if(opts.compare(found, subpacket) >= 0) {
                            found = subpacket;
                        }
                    }
                    if(found) {
                        found.game_id = found.id;
                        server.tableRowClick(server, found);
                    }
                }
                return false;
            } else {
                return true;
            }
        };

        server.registerUpdate(updated);

        server.refreshTables(opts.string, { delay: null });

        return this;
    };

    jpoker.plugins.featuredTable.defaults = {
        string: '',
        compare: function(a, b) { return a && b && b.players - a.players; }
    };

    //
    // table
    //
    jpoker.plugins.table = function(url, game_id, name, options) {

        var opts = $.extend({}, jpoker.plugins.table.defaults, options);
        var server = jpoker.url2server({ url: url });

        game_id = parseInt(game_id, 10);

        return this.each(function() {
                var $this = $(this);

                var id = jpoker.uid();

                $this.append('<span class=\'jpokerTable\' id=\'' + id + '\'>' + _("connecting to table {name}").supplant({ 'name': name }) + '</span>');
                
                server.tableJoin(game_id);

                var updated = function(server) {
                    var element = document.getElementById(id);
                    if(element) {
                        if(game_id in server.tables) {
                            jpoker.plugins.table.create($(element), id, server, game_id);
                            return false;
                        } else {
                            return true;
                        }
                    } else {
                        return false;
                    }
                };

                server.registerUpdate(updated);

                return this;
            });
    };

    jpoker.plugins.table.defaults = $.extend({
        }, jpoker.defaults);

    jpoker.plugins.table.create = function(element, id, server, game_id) {
        if(game_id in server.tables) {
            var table = server.tables[game_id];
            element.html(this.templates.room.supplant({ id: id }));
            jpoker.plugins.table.seats(id, server, table);
            for(var seat = 0; seat < table.seats.length; seat++) {
                $('#dealer' + seat + id).hide();
            }
            for(var board = 0; board < table.board.length; board++) {
                $('#board' + board + id).hide();
            }
            for(var pot = 0; pot < table.pots.length; pot++) {
                var pot_element = $('#pot' + pot + id);
		pot_element.hide();
		pot_element.css('text-align', 'center');
		pot_element.css('line-height', '48px');
		pot_element.css('font-weight', 'bold');
            }
            for(var winner = 0; winner < 2; winner++) {
                $('#winner' + winner + id).hide();
            }
            $('#rebuy' + id).hide();
            $('#chat' + id).html('<input value=\'chat here\' type=\'text\' width=\'100%\' />').hide();
            jpoker.plugins.playerSelf.hide(id);
            table.registerUpdate(this.update, id, 'update' + id);
            table.registerDestroy(this.destroy, id, 'destory' + id);
        }
    };

    jpoker.plugins.table.seats = function(id, server, table) {
        for(var seat = 0; seat < table.seats.length; seat++) {
            jpoker.plugins.player.seat(seat, id, server, table);
        }
    };

    jpoker.plugins.table.update = function(table, packet, id) {
        var element = document.getElementById(id);
        var server = jpoker.getServer(table.url);
        var url = table.url;
        var game_id = packet.game_id;
        var serial = packet.serial;
        if(element && server) {
            switch(packet.type) {

            case 'PacketSerial':
                jpoker.plugins.table.seats(id, jpoker.servers[table.url], table);
                break;

            case 'PacketLogout':
                jpoker.plugins.table.seats(id, jpoker.servers[table.url], table);
                break;

            case 'PacketPokerPlayerArrive':
                jpoker.plugins.player.create(table, packet, id);
                break;

            case 'PacketPokerPlayerLeave':
                jpoker.plugins.player.leave(table, packet, id);
                break;

            case 'PacketPokerUserInfo':
                jpoker.plugins.playerSelf.rebuy(url, game_id, serial);
                break;

            case 'PacketPokerBoardCards':
                jpoker.plugins.cards.update(table.board, '#board', id);
                break;

            case 'PacketPokerPotChips':
                jpoker.plugins.chips.update(table.pots[packet.index], '#pot' + packet.index + id);
                break;

            case 'PacketPokerChipsPotReset':
                for(var pot = 0; pot < table.pots.length; pot++) {
                    $('#pot' + pot + id).hide();
                }
                break;

            case 'PacketPokerDealer':
                for(var seat = 0; seat < table.seats.length; seat++) {
                    if(seat == packet.dealer) {
                        $('#dealer' + seat + id).show();
                    } else {
                        $('#dealer' + seat + id).hide();
                    }
                }
                break;

            case 'PacketPokerPosition':
                for(var seat1 = 0; seat1 < table.seats.length; seat1++) {
                    var seat_element = $('#player_seat' + seat1 + '_name' + id);
                    var player = table.serial2player[packet.serial];
                    if(packet.serial > 0 && player.sit === true && player.seat == seat1) {
                        if(!seat_element.hasClass('jpokerPosition')) {
                            seat_element.addClass('jpokerPosition');
                        }
                    } else {
                        if(seat_element.hasClass('jpokerPosition')) {
                            seat_element.removeClass('jpokerPosition');
                        }
                    }
                }
                break;

            case 'PacketPokerChat':
                var prefix = '';
                if(packet.serial in table.serial2player) {
                    prefix = table.serial2player[packet.serial].name + ' :';
                }
                $('#chat_history' + id).prepend('<div class=\'jpokerChatLine\'><span class=\'jpokerChatPrefix\'>' + prefix + '</span><span class=\'jpokerChatMessage\'>' + packet.message + '</span></div>');
                break;
            }

            return true;
        } else {
            return false;
        }
    };

    jpoker.plugins.table.destroy = function(table, dummy, id) {
        var element = document.getElementById(id);
        if(element) {
            $(element).remove();
        }
        return false;
    };

    jpoker.plugins.table.templates = {
        room: 'expected to be overriden by mockup.js but was not'
    };

    //
    // player (table plugin helper)
    //
    jpoker.plugins.player = {
        create: function(table, packet, id) {
            var url = table.url;
            var game_id = table.id;
            var serial = packet.serial;
            var player = table.serial2player[serial];
            var seat = player.seat;
            var server = jpoker.getServer(url);
            jpoker.plugins.player.seat(seat, id, server, table);
            for(var card = 0; card < player.cards.length; card++) {
                $('#card_seat' + seat + card + id).hide();
            }
            var bet = $('#player_seat' + seat + '_bet' + id);
            bet.hide();
            bet.css('text-align', 'center');
            bet.css('line-height', '48px');
            bet.css('font-weight', 'bold');
            var money = $('#player_seat' + seat  + '_money' + id);
            money.hide();
            money.css('text-align', 'center');
            money.css('line-height', '10px');
            money.css('font-size', 'small');
            money.css('font-weight', 'bold');
	    money.css('color', '#e5b408');
            var name = $('#player_seat' + seat + '_name' + id);
            name.css('text-align', 'center');
            name.css('line-height', '10px');
            name.css('font-size', 'small');
            name.css('font-weight', 'bold');
            name.css('color', '#ffffff');
            name.html(packet.name);
            if(server.serial == serial) {
                jpoker.plugins.playerSelf.create(table, packet, id);
            }
            jpoker.plugins.player.sitOut(player, id);
            player.registerUpdate(this.update, id, 'update' + id);
            player.registerDestroy(this.destroy, id, 'destroy' + id);
        },

        leave: function(player, packet, id) {
            var server = jpoker.getServer(player.url);
            if(server.serial == packet.serial) {
                jpoker.plugins.playerSelf.leave(player, packet, id);
            }
        },

        update: function(player, packet, id) {
            switch(packet.type) {

            case 'PacketPokerSit':
            jpoker.plugins.player.sit(player, id);
            break;

            case 'PacketPokerSitOut':
            jpoker.plugins.player.sitOut(player, id);
            break;

            case 'PacketPokerPlayerCards':
            jpoker.plugins.cards.update(player.cards, '#card_seat' + player.seat, id);
            break;

            case 'PacketPokerPlayerChips':
            jpoker.plugins.player.chips(player, packet, id);
            break;

            case 'PacketPokerSelfInPosition':
            jpoker.plugins.playerSelf.inPosition(player, packet, id);
            break;

            case 'PacketPokerSelfLostPosition':
            jpoker.plugins.playerSelf.lostPosition(player, packet, id);
            break;

            }
            return true;
        },
        
        sit: function(player, id) {
            var name = $('#player_seat' + player.seat + '_name' + id);
            if(name.hasClass('jpokerSitOut')) {
                name.removeClass('jpokerSitOut');
            }
            if(jpoker.getServer(player.url).serial == player.serial) {
                jpoker.plugins.playerSelf.sit(player, id);
            }
        },

        sitOut: function(player, id) {
            var name = $('#player_seat' + player.seat + '_name' + id);
            if(!name.hasClass('jpokerSitOut')) {
                name.addClass('jpokerSitOut');
            }
            if(jpoker.getServer(player.url).serial == player.serial) {
                jpoker.plugins.playerSelf.sitOut(player, id);
            }
        },

        chips: function(player, packet, id) {
            jpoker.plugins.chips.update(player.money, '#player_seat' + player.seat + '_money' + id);
            jpoker.plugins.chips.update(player.bet, '#player_seat' + player.seat + '_bet' + id);
            if(jpoker.getServer(player.url).serial == player.serial) {
                jpoker.plugins.playerSelf.chips(player, packet, id);
            }
        },

        seat: function(seat, id, server, table) {
            if(table.seats[seat] !== null) {
                $('#seat' + seat + id).show();
                $('#sit_seat' + seat + id).hide();
            } else {            
                $('#seat' + seat + id).hide();
                if(server.loggedIn()) {
                    var sit = $('#sit_seat' + seat + id);
                    sit.show();
                    sit.click(function() {
                            var server = jpoker.getServer(table.url);
                            if(server && server.loggedIn()) {
                                server.sendPacket({ 'type': 'PacketPokerSeat',
                                            'serial': server.serial,
                                            'game_id': table.id,
                                            'seat': seat
                                            });
                            }
                        });
                } else {
                    $('#sit_seat' + seat + id).hide();
                }
            }
        },

        destroy: function(player, dummy, id) {
            var server = jpoker.servers[player.url];
            var table = server.tables[player.game_id];
            jpoker.plugins.player.seat(player.seat, id, server, table);
            if(player.serial == server.serial) {
                jpoker.plugins.playerSelf.destroy(player, dummy, id);
            }
        }
    };

    //
    // player self (table plugin helper)
    //
    jpoker.plugins.playerSelf = {
        create: function(table, packet, id) {
            var name = $('#player_seat' + packet.seat + '_name' + id);
            name.css('color', '#ffffff');
            name.html(packet.name);
            table.registerUpdate(this.updateTable, id, 'update' + id);

            var url = table.url;
            var game_id = packet.game_id;
            var serial = packet.serial;
            var names = [ 'check', 'call', 'raise', 'fold' ];
            var labels = [ _("check"), _("call"), _("raise"), _("fold") ];
            for(var i = 0; i < names.length; i++) {
                $('#' + names[i] + id).html('<div class=\'jpokerButton\'>' + labels[i] + '</div>');
            }
            var rebuy = $('#rebuy' + id);
            rebuy.click(function() {
                    var server = jpoker.getServer(url);
                    if(server && server.loggedIn()) {
                        var element = jpoker.plugins.playerSelf.rebuy(url, game_id, serial);
                        if(element) {
                            element.dialog('open');
                            server.getUserInfo();
                        }
                    }
                });
            rebuy.show();
            rebuy.click();
            var chat = function() {
                var server = jpoker.getServer(url);
                if(server) {
                    var input = $('#chat' + id + ' input');
                    var message = input.attr('value').replace(/[\'\"]/g, '');
                    server.sendPacket({ 'type': 'PacketPokerChat',
                                'serial': server.serial,
                                'game_id': table.id,
                                'message': message
                                });
                    input.attr('value', ' ');
                }
            };
            $('#chat' + id).keypress(function(e) {
                    if(e.which == 13) {
                        chat();
                    }
                }).show();
        },

        leave: function(player, packet, id) {
            $('#rebuy' + id).hide();
            $('#chat' + id).hide();
        },

        updateTable: function(table, packet, id) {
            switch(packet.type) {

            }
            return true;
        },
        
        rebuy: function(url, game_id, serial) {
            var player = jpoker.getPlayer(url, game_id, serial);
            if(!player) {
                return false;
            }
            var table = jpoker.getTable(url, game_id);
            var limits = table.buyInLimits();
            var rebuy = $('#jpokerRebuy');
            if(rebuy.size() === 0) {
                $('body').append('<div id=\'jpokerRebuy\' class=\'flora\' title=\'' + _("Add chips") + '\' />');
                rebuy = $('#jpokerRebuy');
                rebuy.dialog({ autoOpen: false });
            }
            rebuy.empty();
            rebuy.append('<div class=\'jpokerRebuyBound jpokerRebuyMin\'>' + limits[0] + '</div>');
            rebuy.append('<div class=\'ui-slider-1\' style=\'margin:10px;\'><div class=\'ui-slider-handle\'></div></div>');
            rebuy.append('<div class=\'jpokerRebuyCurrent\'>' + limits[1] + '</div>');
            rebuy.append('<div class=\'jpokerRebuyBound jpokerRebuyMax\'>' + limits[2] + '</div>');
            var packet_type;
            var label;
            if(player.state == 'buyin') {
                packet_type = 'PacketPokerBuyIn';
                label = _("Buy In");
            } else {
                packet_type = 'PacketPokerRebuy';
                label = _("Rebuy");
            }
            var button = $('<div class=\'ui-dialog-buttonpane\'/>').appendTo(rebuy);
            $(document.createElement('button')).
            text(label).
            click(function() {
                    var server = jpoker.getServer(url);
                    if(server) {
                        server.sendPacket({ 'type': packet_type,
                                    'serial': server.serial,
                                    'game_id': table.id,
                                    'amount': parseInt($('.jpokerRebuyCurrent', rebuy).html(), 10) * 100
                                    });
                    }
                    rebuy.dialog('close');
                }).
            appendTo(button);
            $('.ui-slider-1', rebuy).slider({
                    min: limits[0],
                        startValue: limits[1],
                        max: limits[2],
                        change: function(event, ui) {
                        $('.jpokerRebuyCurrent', ui.element).html(ui.value);
                    }
                });
            return rebuy;
        },

        sit: function(player, id) {
            var name = $('#player_seat' + player.seat + '_name' + id);
            var url = player.url;
            var server = jpoker.servers[url];
            var serial = player.serial;
            var game_id = player.game_id;
            name.unbind('click');
            name.html(player.name);
            name.click(function() {
                    var server = jpoker.servers[url];
                    if(server) {
                        server.sendPacket({ 'type': 'PacketPokerSitOut',
                                    'serial': serial,
                                    'game_id': game_id
                                    });
                    }
                });
        },

        sitOut: function(player, id) {
            var name = $('#player_seat' + player.seat + '_name' + id);
            var url = player.url;
            var server = jpoker.servers[url];
            var serial = player.serial;
            var game_id = player.game_id;
            name.unbind('click');
            name.html(_("click to sit"));
            name.click(function() {
                    var server = jpoker.servers[url];
                    if(server) {
                        var player = server.tables[game_id].serial2player[serial];
                        if(player.money > jpoker.chips.epsilon) {
                            server.sendPacket({ 'type': 'PacketPokerAutoBlindAnte',
                                        'serial': serial,
                                        'game_id': game_id
                                        });
                            server.sendPacket({ 'type': 'PacketPokerSit',
                                        'serial': serial,
                                        'game_id': game_id
                                        });
                        } else {
                            jpoker.dialog(_("not enough money"));
                        }
                    }
                });
        },

        chips: function(player, packet, id) {
            return; // no test yet
            var table = jpoker.getTable(player.url, player.game_id);
            if(table.state == 'end') {
                var limits = table.buyInLimits();
                if(packet.money < limits[2]) {
                    $('#rebuy' + id).show();
                } else {
                    $('#rebuy' + id).hide();
                }
            }
        },

        inPosition: function(player, packet, id) {
            var game_id = player.game_id;
            var serial = player.serial;
            var url = player.url;
            var table = jpoker.getTable(url, game_id);
            var betLimit = table.betLimit;
            var send = function(what) {
                var server = jpoker.getServer(url);
                if(server) {
                    server.sendPacket({ 'type': 'PacketPoker' + what,
                                'serial': serial,
                                'game_id': game_id
                                });
                }
            };
            $('#fold' + id).unbind('click').click(function() { send('Fold'); }).show();
            if(betLimit.call > 0) {
                $('#call' + id).unbind('click').click(function() { send('Call'); }).show();
            } else {
                $('#check' + id).unbind('click').click(function() { send('Check'); }).show();
            }
            if(betLimit.allin > betLimit.call) {
                var click;
                if(betLimit.max > betLimit.min) {
                    var raise = $('#raise_range' + id);
                    raise.empty();
                    raise.append('<span class=\'jpokerRaiseBound jpokerRaiseMin\'>' + jpoker.chips.SHORT(betLimit.min) + '</span> ');
                    raise.append('<span class=\'jpokerRaiseCurrent\' title=\'' + betLimit.min + '\'>' + jpoker.chips.SHORT(betLimit.min) + '</span> ');
                    raise.append('<span class=\'jpokerRaiseBound jpokerRaiseMax\'>' + jpoker.chips.SHORT(betLimit.max) + '</span> ');
                    raise.append('<div class=\'ui-slider-1\' style=\'margin:10px; width:70px; \'><div class=\'ui-slider-handle\'></div></div>');
                    raise.show(); // must be visible otherwise outerWeight/outerWidth returns 0
                    $('.ui-slider-1', raise).slider({
                            min: betLimit.min,
                                startValue: betLimit.min,
                                max: betLimit.max,
                                axis: 'horizontal',
                                stepping: betLimit.step,
                                change: function(event, ui) {
                                var current = $('.jpokerRaiseCurrent', ui.element);
                                current.html(jpoker.chips.SHORT(ui.value));
                                current.attr('title', ui.value);
                            }
                        });
                    click = function() {
                        var server = jpoker.getServer(url);
                        if(server) {
                            server.sendPacket({ 'type': 'PacketPokerRaise',
                                        'serial': serial,
                                        'game_id': game_id,
                                        'amount': parseInt($('.jpokerRaiseCurrent', raise).attr('title'), 10) * 100
                                        });
                        }
                    };
                } else {
                    click = function() {
                        var server = jpoker.getServer(url);
                        if(server) {
                            server.sendPacket({ 'type': 'PacketPokerRaise',
                                        'serial': serial,
                                        'game_id': game_id,
                                        'amount': 0
                                        });
                        }
                    };
                }
                $('#raise' + id).unbind('click').click(click).show();
            }
        },

        lostPosition: function(player, packet, id) {
            jpoker.plugins.playerSelf.hide(id);
        },

        names: [ 'fold', 'call', 'check', 'raise', 'raise_range', 'rebuy' ],

        hide: function(id) {
            for(var i = 0; i < this.names.length; i++) {
                $('#' + this.names[i] + id).hide();
            }
        },

        destroy: function(player, dummy, id) {
            jpoker.plugins.playerSelf.hide(id);
        }
    };

    //
    // cards (table plugin helper)
    //
    jpoker.plugins.cards = {
        update: function(cards, prefix, id) {
            for(var i = 0; i < cards.length; i++) {
                var card = cards[i];
                if(card) {
                    var card_image = 'small-back';
                    if(card != 255) {
                        card_image = 'small-' + jpoker.cards.card2string[card & 0x3F];
                    }
                    $(prefix + i + id).css({ 
                            'background-image': 'url("images/cards/' + card_image + '.png")',
                                'display': 'block'
                                });
                } else {
                    $(prefix + i + id).hide();
                }
            }
        }
    };
    //
    // chips (table plugin helper)
    //
    jpoker.plugins.chips = {
        update: function(chips, id) {
            var element = $(id);
            if(chips > 0) {
                element.show();
                element.html(jpoker.chips.SHORT(chips));
                element.attr('title', jpoker.chips.LONG(chips));
            } else {
                element.hide();
            }
        }

    };
})(jQuery);
