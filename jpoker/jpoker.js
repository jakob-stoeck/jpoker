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
jpoker = {

    uid: (
           function(){
               var id=0;
               return function(){
                   return id++ ;
               };
           }
           )()
	
};

	
jpoker.TableList = function(place, key, id) {
        
    this.place = place;
		
    this.key = key || 'jpoker_autoid_';
		
    this.getId = function(){
        return this.key + jpoker.uid();
    };
        
    this.id = id = id || this.getId();
		
    this.table = $(place).append('<table class="jPokerTableList" id="' + this.id + '"></table>');

    var self = this;

    var cb = function(com, game_id, packet) {
        self.populateTable(id, packet);
    };
    jpoker.com.registerHandler(jpoker.com, 0, cb);

    return id;
};

jpoker.TableList.prototype = {

    place: null,

    key: null,

    id: null,

    table: null,

    interval: 5000,
	
    timerId: null,

    clearTimeout: function(id) { return window.clearTimeout(id); },

    setTimeout: function(cb, delay) { return window.setTimeout(cb, delay); },

    setTimer: function(id) {
        jpoker.TableList.prototype.clearTimeout(jpoker.TableList.prototype.timerId);
        jpoker.TableList.prototype.timerId = jpoker.TableList.prototype.setTimeout(function(){
                jpoker.TableList.prototype.refresh(id);
            },
            jpoker.TableList.prototype.interval);
    },

    refresh: function(id) {
        if(window.Components && window.netscape && window.netscape.security && document.location.protocol.indexOf("http") == -1) {
            window.netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
        }
        jpoker.com.sendPacket(jpoker.com, {"type": "PacketPokerTableSelect", "string": ""});
    },
	
    populateTable: function(id, packet) {
        var table = document.getElementById(id);
        if (table) {
            $(table).html(jpoker.TableList.prototype.getHTML(packet));
            jpoker.TableList.prototype.setTimer(id);
        }
    },
	
    getHTML: function(packet) {
        var c = jpoker.TableList.prototype;
        var t = c.templates;
        var html = [];
        html.push(t.header);
        for(var i = 0; i < packet.packets.length; i++) {
            var subpacket = packet.packets[i];
            var rowHTML = t.rows;
            $.each(subpacket,function(n,val){
                    rowHTML = rowHTML.replace('\%'+n,val);
                });
            html.push(rowHTML.replace('\%class',(i%2? 'evenRow':'oddRow')));
        }
        html.push(t.footer);
        return html.join('\n');
    },

    templates: {
        header : '<thead><tr><td>Name</td><td>Players</td><td>Seats</td><td>Betting Structure</td><td>Average Pot</td><td>Hands/Hour</td><td>%Flop</td></tr></thead><tbody>',
        rows : '<tr class="%class"><td>%name</td><td>%players</td><td>%seats</td><td>%betting_structure</td><td>%average_pot</td><td>%hands_per_hour</td><td>%percent_flop</td></tr>',
        footer : '</tbody>'
    }
};

jpoker.com = {

    request: {
        url: '/REST?session=yes',
        mode: "queue",
        type: "POST",
        dataType: "json",
        error: function(xhr, textStatus, errorThrown) {
            throw errorThrown;
        }
    },
    
    blocked: false,

    queues: {},

    lagmax: 60,

    lag: 0,

    high: ['PacketPokerChat', 'PacketPokerMessage', 'PacketPokerGameMessage'],
    // milliseconds
    pollFrequency:  100,

    incomingTimer: -1,

    // milliseconds
    pingFrequency: 5000,

    outgoingTimer: -1,

    verbose: 0,

    clearTimeout: function(id) { return window.clearTimeout(id); },

    setTimeout: function(cb, delay) { return window.setTimeout(cb, delay); },

    message: function(self, str) { if(window.console) { window.console.log(str); } },

    ajax: function(o) { return jQuery.ajax(o); },

    now: function(self) { return Date.now(); },

    handlers: {},

    registerHandler: function(self, id, handler) {
        if(!(id in self.handlers)) {
            self.handlers[id] = [];
        }
        self.handlers[id].push(handler);
    },

    unregisterHandler: function(self, id, handler) {
        self.handlers[id] = jQuery.grep(self.handlers[id],
                                        function(e, i) { return e != handler; });
        if(self.handlers[id].length <= 0) {
            delete self.handlers[id];
        }
    },

    handle: function(self, id, packet) {
        if(id in self.handlers) {
            handlers = self.handlers[id];
            for(var i = 0; i < handlers.length; i++) {
                handlers[i](self, id, packet);
            }
        }
    },

    delays: {},

    delayQueue: function(self, id, time) {
        self.delays[id] = time;
    },

    noDelayQueue: function(self, id) {
        if(id in self.delays) {
            delete self.delays[id];
        }
    },

    // null => no delay
    handleDelay: function(self, id) {
        if(id in self.delays) {
            return self.delays[id];
        } else {
            return null;
        }
    },

    sendPacket: function(self, packet) {
        var args = {
            data: JSON.stringify(packet),
            success: function(data, status) {
                self.queueIncoming(self, data);
            }
        };
	self.ajax(jQuery.extend(args, self.request));
        self.clearTimeout(self.outgoingTimer);
        self.outgoingTimer = self.setTimeout(function() {
                self.sendPacket(self, { type: "PacketPing" });
            }, self.pingFrequency);
    },

    queueIncoming: function(self, packets) {
        for(var i = 0; i < packets.length; i++) {
            packet = packets[i];
            if("session" in packet) {
                delete packet.session;
            }
            packet.time__ = self.now();
            var id;
            if("game_id" in packet) {
                id = packet.game_id;
            } else {
                id = 0;
            }
            if(!(id in self.queues)) {
                self.queues[id] = { 'high': {'packets': [],
                                             'delay': 0 },
                                    'low': {'packets': [],
                                            'delay': 0 } };
            }
            if(jQuery.inArray(packet.type, self.high) >= 0) {
                queue = self.queues[id].high;
            } else {
                queue = self.queues[id].low;
            }
            queue.packets.push(packet);
        }
        self.clearTimeout(self.incomingTimer);
        self.incomingTimer = self.setTimeout(function() { self.dequeueIncoming(self); }, self.pollFrequency);
    },

    dequeueIncoming: function(self) {
        if(!self.blocked) {
            now = self.now();
            self.lag = 0;
            for(var id in self.queues) {
                for(var priority in self.queues[id]) {
                    queue = self.queues[id][priority];
                    if(queue.packets.length <= 0) {
                        continue;
                    }
                    lag = now - queue.packets[0].time__;
                    self.lag = Math.max(self.lag, lag);
                    if(queue.delay > now && lag > self.lagmax) {
                        queue.delay = 0;
                    }
                    if(queue.delay <= now) {
                        delay = self.handleDelay(self, id);
                        if(lag > self.lagmax || delay === null || delay <= now) {
                            packet = queue.packets.shift();
                            delete packet.time__;
                            self.handle(self, id, packet);
                        } else {
                            queue.delay = delay;
                        }
                    } else if(self.verbose > 0) {
                        self.message("wait for " + queue.delay / 1000.0 + "s for queue " + id);
                    }
                }
                //
                // get rid of queues with no associated delay AND no pending packets
                //
                queue = self.queues[id];
                if(queue.high.packets.length <= 0 && queue.low.packets.length <= 0) {
                    if(queue.high.delay <= now && queue.low.delay <= now) {
                        delete self.queues[id];
                    }
                }
            }
        }
        var empty = true;
        for(var j in self.queues) {
            empty = false;
            break;
        }
        self.clearTimeout(self.incomingTimer);
        if(!empty) {
            self.incomingTimer = self.setTimeout(function() { self.dequeueIncoming(self); }, self.pollFrequency);
        }
    }
};
