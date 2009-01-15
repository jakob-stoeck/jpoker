//
//     Copyright (C) 2009 Loic Dachary <loic@dachary.org>
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

module("jpokeradmin");

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
        this.server.open(type, url, async);
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

var cleanup = function() {
    $("#main").empty();
};

var start_and_cleanup = function(id) {
    setTimeout(function() {
            cleanup(id);
            start();
        }, 1);
};

$.fn.triggerKeypress = function(keyCode) {
    return this.trigger("keypress", [$.event.fix({event:"keypress", keyCode: keyCode, target: this[0]})]);
};

//
// tourneyAdminList
//
test("jpoker.plugins.tourneyAdminList", function(){
        expect(3);

        var PokerSQL = function() {};

	var TOURNEY_LIST = [{"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 1111, "sit_n_go": "y", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval" : 60, "variant": "holdem", "currency_serial": 1, "state": "registering", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 39, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first" : 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "announced", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 40, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial" : 41, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 42, "sit_n_go": "n", "registered": 0}];
	var start_time = new Date(TOURNEY_LIST[1].start_time*1000).toLocaleString();
	var state = TOURNEY_LIST[1].state;

        PokerSQL.prototype = {
            open: function(type, url, async) {
                equals(url.indexOf('FROM+tourneys_schedule') >= 0, true, url);
            },

            outgoing: JSON.stringify(TOURNEY_LIST),
            handle: function(packet) { }
        };

        ActiveXObject.prototype.server = new PokerSQL();

        var place = $("#main");
        $.jpoker.plugins.tourneyAdminList.defaults.callback.display_done = function(element) {
            var tr = $('tbody tr', element);
            equals(tr.length, 5, 'number of rows');
        };
        place.jpoker('tourneyAdminList', 'url');

        var update = $.jpoker.plugins.tourneyAdminList.update;
        $.jpoker.plugins.tourneyAdminList.update = function(url, id, tourney, options) {
            equals(url.indexOf('pokersql') >= 0, true, url);
        };
        $('tbody tr', place).eq(1).triggerKeypress("13");
        $.jpoker.plugins.tourneyAdminList.update = update;
        cleanup();
    });


test("jpoker.plugins.tourneyAdminList update", function(){
        expect(7);

        var tourney_serial = 1111;
	var TOURNEY_LIST = [{"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": tourney_serial, "sit_n_go": "y", "registered": 0}];

        var tourneyAdminList = $.jpoker.plugins.tourneyAdminList;
        var place = $("#main");
        var id = 'id1';
        place.html(tourneyAdminList.getHTML(id, TOURNEY_LIST, tourneyAdminList.defaults));
        tourneyAdminList.decorate('url', id, TOURNEY_LIST, tourneyAdminList.defaults);

        //
        // the element does not exist, do nothing
        //
        equals(tourneyAdminList.update('url', id, { id: 'fakeid' }, {}), false, 'no element matching tourney id');
        //
        // nothing changed, nothing done
        //
        equals(tourneyAdminList.update('url', id, TOURNEY_LIST[0], {}), undefined, 'no change');
        
        var ajax;
        //
        // the pokersql webservice returns an unepxected number of modified rows, throw
        //
        $('input[name=description_short]', place).attr('value', 'TEXT');
        try {
            ajax = function(params) {
                equals(params.url.indexOf('description_short') >= 0, true, 'name description_short');
                equals(params.url.indexOf('TEXT') >= 0, true, 'value description_short');
                params.success(5, undefined);
            };
            tourneyAdminList.update('url', id, TOURNEY_LIST[0], { ajax: ajax });
        } catch(e) {
            equals(e.toString().indexOf('modified 5 rows') >=0, true, e.toString());
        }

        //
        // the XHR request fails, throws
        //
        try {
            ajax = function(params) {
                params.error('xhr', 'status', 'ERROR');
            };
            tourneyAdminList.update('url', id, TOURNEY_LIST[0], { ajax: ajax });
        } catch(e) {
            equals(e.toString().indexOf('ERROR') >=0, true, e.toString());
        }

        //
        // the update succeeds
        //
        ajax = function(params) {
            params.success(1, 'status');
        };
        equals(tourneyAdminList.update('url', id, TOURNEY_LIST[0], { ajax: ajax }), true, 'update succeeds');

        cleanup();
    });

