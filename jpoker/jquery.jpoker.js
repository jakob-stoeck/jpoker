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

//
// dispatch the jpoker jQuery widget "name" to the appropriate
// implementation in the jpoker name space
//
jQuery.fn.jpoker = function(name, options) {
    return this.each(function() {
            var $this = $(this);
            eval('jQuery.jpoker.' + name + '.call($this, options)');
        });
};

(function($) {

    var jpoker = $.jpoker;

    jpoker = {
        uid: (
              function(){
                  var id=0;
                  return function(){
                      return "jpoker" + id++ ;
                  };
              }
              )(),
        error: function(e) {
            this.errorHandler(e);
            throw e;
        },
        errorHandler: function(e) {
            
        }
    };
	
    //
    // jQuery widget that displays a list of tables from 
    // the "com" poker server
    //
    jpoker.TableList = function(com, options) {
        var opts = $.extend({}, jpoker.TableList.defaults, options);
        
        return this.each(function() {
                var $this = $(this);
                
                id = jpoker.uid();
		
                $this.append('<table class="jPokerTableList" id="' + id + '"></table>');

                var request = function(com, element) {
                    com.sendPacket({
                            "type": "PacketPokerTableSelect",
                            "string": opts['string']
                        });
                };

                var handler = function(com, element, packet) {
                    $(element).html(jpoker.TableList.getHTML(packet));
                };

                jpoker.SyncElement(com, id, request, handler, options);

                return $this;
            });
    };

    jpoker.TableList.defaults = $.extend({
        string: ''
        }, jpoker.SyncElement.default);

    jpoker.TableList.getHTML = {
        var t = this.templates;
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
    };

    jpoker.TableList.templates = {
        header : '<thead><tr><td>Name</td><td>Players</td><td>Seats</td><td>Betting Structure</td><td>Average Pot</td><td>Hands/Hour</td><td>%Flop</td></tr></thead><tbody>',
        rows : '<tr class="%class"><td>%name</td><td>%players</td><td>%seats</td><td>%betting_structure</td><td>%average_pot</td><td>%hands_per_hour</td><td>%percent_flop</td></tr>',
        footer : '</tbody>'
    };

    //
    // refresh element "id" with the "handler" function after sending
    // a packets with the "request" function to the "com" poker server 
    //
    jpoker.SyncElement = function(com, id, request, handler, options) {
        var opts = $.extend({}, jpoker.SyncElement.defaults, options);
        
        var waiting = false;

        var time_sent = 0;

        var timer = jpoker.SyncElement.setInterval(function() {
                var element = jpoker.SyncElement.getElementById(id);
                if(element) {
                    if(waiting) {
                        if(( com.now() - time_sent ) > opts['delay']) {
                            jpoker.error("jpoker.SyncElement timed out after " + opts['delay'] + " seconds trying to update element id " + id);
                        }
                    } else {
                        time_sent = com.now();
                        waiting = true;
                        request(com, element);
                    }
                } else {
                    jpoker.SyncElement.clearInterval(timer);
                }
            }, opts['delay']);

        var cb = function(com, game_id, packet) {
            waiting = false;
            var element = jpoker.SyncElement.getElementById(id);
            if(element) {
                handler(com, element, packet);
            }
        };

        com.registerHandler(opts['game_id'], cb, opts);

    };
        
    jpoker.SyncElement.defaults = {
        delay: 5000,
        game_id: 0
        
    };
    
    jpoker.SyncElement.setInterval = function(cb, delay) { return window.setInterval(cb, delay); };
    jpoker.SyncElement.clearInterval = function(id) { return window.clearInterval(id); };
    jpoker.SyncElement.getElementById = function(id) { return document.getElementById(id); };
    
    //
    // manage incoming and outgoing packet queues to the poker server
    //
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
            var $this = this;
            var args = {
                data: JSON.stringify(packet),
                success: function(data, status) {
                    $this.queueIncoming(data);
                }
            };
            this.ajax(jQuery.extend(args, this.request));
            this.clearTimeout(this.outgoingTimer);
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

        dequeueIncoming: function() {
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
