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
$.fn.jpoker = function(name, options) {
    return this.each(function() {
            var $this = $(this);
            eval('jQuery.jpoker.' + name + '.call($this, opts)');
        });
};

(function($) {

    $.fn.jpoker.uid = (
                      function(){
                          var id=0;
                          return function(){
                              return id++ ;
                          };
                      }
                       )();
	
})(jQuery);

(function($) {

    var jpoker = $.fn.jpoker;

    jpoker.TableList = function(fun, options) {
        var opts = $.extend({}, jpoker.TableList.defaults, options);
        
        return this.each(function() {
                var $this = $(this);
                
                $this.place = place;
		
                $this.key = key || 'jpoker_autoid_';
		
                $this.getId = function(){
                    return $this.key + jpoker.uid();
                };
        
                $this.id = id = id || $this.getId();
		
                $this.table = $(place).append('<table class="jPokerTableList" id="' + $this.id + '"></table>');

                var cb = function(com, game_id, packet) {
                    $this.populateTable(id, packet);
                };
                jpoker.com.registerHandler(0, cb);

                return id;
            });
    };

    var attr = {

        defaults = { },

        place: null,

        key: null,

        id: null,

        table: null,

        interval: 5000,
	
        timerId: null,

        clearTimeout: function(id) { return window.clearTimeout(id); },

        setTimeout: function(cb, delay) { return window.setTimeout(cb, delay); },

        setTimer: function(id) {
            this.clearTimeout(this.timerId);
            var $this = this;
            this.timerId = this.setTimeout(function(){
                    $this.refresh(id);
                },
                this.interval);
        },

        refresh: function(id) {
            if(window.Components && window.netscape && window.netscape.security && document.location.protocol.indexOf("http") == -1) {
                window.netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
            }
            jpoker.com.sendPacket({"type": "PacketPokerTableSelect", "string": ""});
        },
	
        populateTable: function(id, packet) {
            var table = document.getElementById(id);
            if (table) {
                $(table).html(this.getHTML(packet));
                this.setTimer(id);
            }
        },
	
        getHTML: function(packet) {
            var c = this;
            var t = c.templates;
            var html = [];
            html.push(t.header);
            for(var i = 0; i < packet.packets.length; i++) {
                var subpacket = packet.packets[i];
                var rowHTML = t.rows;
                $.each(subpacket, function(n,val){
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
    
    $.each(attr, function(a) {
            jpoker.TableList.prototype[a] = this;
        });
};

(function($) {

    var jpoker = $.fn.jpoker;

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

        message: function(str) { if(window.console) { window.console.log(str); } },

        ajax: function(o) { return jQuery.ajax(o); },

        now: function() { return Date.now(); },

        handlers: {},

        registerHandler: function(id, handler) {
            if(!(id in this.handlers)) {
                this.handlers[id] = [];
            }
            this.handlers[id].push(handler);
        },

        unregisterHandler: function(id, handler) {
            this.handlers[id] = jQuery.grep(this.handlers[id],
                                            function(e, i) { return e != handler; });
            if(this.handlers[id].length <= 0) {
                delete this.handlers[id];
            }
        },

        handle: function(id, packet) {
            if(id in this.handlers) {
                handlers = this.handlers[id];
                for(var i = 0; i < handlers.length; i++) {
                    handlers[i](this, id, packet);
                }
            }
        },

        delays: {},

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
            var args = {
                data: JSON.stringify(packet),
                success: function(data, status) {
                    this.queueIncoming(data);
                }
            };
            this.ajax(jQuery.extend(args, this.request));
            this.clearTimeout(this.outgoingTimer);
            var $this = this;
            this.outgoingTimer = this.setTimeout(function() {
                    $this.sendPacket({ type: "PacketPing" });
                }, this.pingFrequency);
        },

        queueIncoming: function(packets) {
            for(var i = 0; i < packets.length; i++) {
                packet = packets[i];
                if("session" in packet) {
                    delete packet.session;
                }
                packet.time__ = this.now();
                var id;
                if("game_id" in packet) {
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
            }
            this.clearTimeout(this.incomingTimer);
            var $this = this;
            this.incomingTimer = this.setTimeout(function() {
                    $this.dequeueIncoming(); },
                this.pollFrequency);
        },

        dequeueIncoming: function(this) {
            if(!this.blocked) {
                now = this.now();
                this.lag = 0;
                for(var id in this.queues) {
                    for(var priority in this.queues[id]) {
                        queue = this.queues[id][priority];
                        if(queue.packets.length <= 0) {
                            continue;
                        }
                        lag = now - queue.packets[0].time__;
                        this.lag = Math.max(this.lag, lag);
                        if(queue.delay > now && lag > this.lagmax) {
                            queue.delay = 0;
                        }
                        if(queue.delay <= now) {
                            delay = this.handleDelay(id);
                            if(lag > this.lagmax || delay === null || delay <= now) {
                                packet = queue.packets.shift();
                                delete packet.time__;
                                this.handle(id, packet);
                            } else {
                                queue.delay = delay;
                            }
                        } else if(this.verbose > 0) {
                            this.message("wait for " + queue.delay / 1000.0 + "s for queue " + id);
                        }
                    }
                    //
                    // get rid of queues with no associated delay AND no pending packets
                    //
                    queue = this.queues[id];
                    if(queue.high.packets.length <= 0 && queue.low.packets.length <= 0) {
                        if(queue.high.delay <= now && queue.low.delay <= now) {
                            delete this.queues[id];
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
    };
})(jQuery);
