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
    $('#jpokerAdminEdit').dialog('close').remove();
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
        expect(4);

        var PokerSQL = function() {};

        var tourney_serial = 1111;
	var TOURNEY_LIST = [{"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": tourney_serial, "sit_n_go": "y", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval" : 60, "variant": "holdem", "currency_serial": 1, "state": "registering", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 39, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first" : 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "announced", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 40, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial" : 41, "sit_n_go": "n", "registered": 0}, {"players_quota": 1000, "breaks_first": 7200, "name": "regular1", "description_short": "Holdem No Limit Freeroll", "start_time": 1216201024, "breaks_interval": 60, "variant": "holdem", "currency_serial": 1, "state": "canceled", "buy_in": 0, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": 42, "sit_n_go": "n", "registered": 0}];
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

        var edit = $.jpoker.tourneyAdminEdit;
        $.jpoker.tourneyAdminEdit = function(url, tourney) {
            equals(url.indexOf('pokersql') >= 0, true, url);
            equals(tourney.serial, tourney_serial);
        };
        $('tbody tr:eq(0) .jpoker_admin_edit a', place).click();
        $.jpoker.tourneyAdminEdit = edit;
        cleanup();
    });


test("jpoker.tourneyAdminEdit", function(){
        expect(1);
        var tourney_serial = 1111;
	var tourney = {"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "betting_structure": "level-001", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": tourney_serial, "sit_n_go": "y", "registered": 0};

        $.jpoker.tourneyAdminEdit('URL', tourney);
        equals($('#jpokerAdminEdit').text().indexOf(tourney_serial.toString()) >= 0, true, tourney_serial.toString());
    });

test("jpoker.plugins.tourneyAdminEdit", function(){
        expect(1);
        var tourney_serial = 1111;
	var tourney = {"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "betting_structure": "level-001", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": tourney_serial, "sit_n_go": "y", "registered": 0};

        $('#main').jpoker('tourneyAdminEdit', 'URL', tourney, {});
        equals($('#main').text().indexOf(tourney_serial.toString()) >= 0, true, tourney_serial.toString());
    });

test("jpoker.plugins.tourneyAdminEdit update", function(){
        expect(6);

        var tourney_serial = 1111;
	var tourney = {"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "betting_structure": "level-001", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": tourney_serial, "sit_n_go": "y", "registered": 0};

        var tourneyAdminEdit = $.jpoker.plugins.tourneyAdminEdit;
        var place = $("#main");
        var id = 'id1';
        place.html(tourneyAdminEdit.getHTML(tourney, tourneyAdminEdit.defaults));
        tourneyAdminEdit.decorate('url', place, tourney, tourneyAdminEdit.defaults);
        var options = $.extend({}, tourneyAdminEdit.defaults);

        //
        // nothing changed, nothing done
        //
        equals(tourneyAdminEdit.update('url', place, tourney, options), undefined, 'no change');
        
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
            options.ajax = ajax;
            tourneyAdminEdit.update('url', place, tourney, options);
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
            options.ajax = ajax;
            tourneyAdminEdit.update('url', place, tourney, options);
        } catch(e) {
            equals(e.toString().indexOf('ERROR') >=0, true, e.toString());
        }

        //
        // the update succeeds
        //
        ajax = function(params) {
            params.success(1, 'status');
        };
        options.ajax = ajax;
        equals(tourneyAdminEdit.update('url', place, tourney, options), true, 'update succeeds');

        cleanup();
    });

