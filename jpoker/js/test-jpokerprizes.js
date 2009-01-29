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

module("jpokerprizes");

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

test("jpoker.tourneyAdminEditPrizes.getPrizes", function(){
        expect(1);
	var prizes = [{"serial": 1, "image_url": "url1"}, {"serial": 2, "image_url": "url2"}];

        var tourneyAdminEditPrizes = $.jpoker.plugins.tourneyAdminEditPrizes;
        var ajax = function(args) {
            args.success(prizes, 'success');
            equals(tourneyAdminEditPrizes.serial2prize[1].serial, 1);
        };
        tourneyAdminEditPrizes.getPrizes('URL', { ajax: ajax });
    });

test("jpoker.tourneyAdminEditPrizes", function(){
        expect(15);
        var tourney_serial = 1111;
	var tourney = {"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "betting_structure": "level-001", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": tourney_serial, "sit_n_go": "y", "registered": 0};
	var prizes = [{"serial": 1, "name": "prize 1", "image_url": "url1"}, {"serial": 2, "name": "prize 2", "image_url": "url2"}];

	var expected = ['SELECT+*+FROM+prizes', 'SELECT+p.serial+FROM+prizes', 'ON+DUPLICATE+KEY+UPDATE', 'ON+DUPLICATE+KEY+UPDATE'];
	var results = [prizes, [{"serial":1}], 1, 2];

	var options = {
	    ajax: function(params) {
		equals(params.url.indexOf('URL'), 0, params.url);
		ok(params.url.indexOf(expected.shift()) >= 0, params.url);
		params.success(results.shift(), 'success');
	    },
	    callback: {
		display_done: function(e) {
		    equals($('select[name=serial] option', e).length, 2);
		    equals($('select[name=serial] option', e).eq(0).text(), 'prize 1');
		    equals($('select[name=serial] option', e).eq(1).text(), 'prize 2');
		}
	    }
	};

	$.jpoker.tourneyAdminEditPrizes('URL', tourney, options);
	equals($('#jpokerAdminEdit').length, 1, 'admin edit dialog');
	equals($('#jpokerAdminEditPrizes').length, 1, 'admin edit prizes');
	$('#jpokerAdminEditPrizes select[name=serial]').val('2').change();
	equals($('#jpokerAdminEditPrizes .jpoker_prize img').attr('src'),  'url2');
	$('#jpokerAdminEditPrizes select[name=serial]').val('1').change();
	equals($('#jpokerAdminEditPrizes .jpoker_prize img').attr('src'),  'url1');
	
	cleanup();
    });


test("jpoker.tourneyAdminEditPrizes no serial defined", function(){
        expect(15);
        var tourney_serial = 1111;
	var tourney = {"players_quota": 2, "breaks_first": 7200, "name": "sitngo2", "description_short" : "Sit and Go 2 players, Holdem", "start_time": 0, "breaks_interval": 3600, "variant": "holdem", "betting_structure": "level-001", "currency_serial" : 1, "state": "registering", "buy_in": 300000, "type": "PacketPokerTourney", "breaks_duration": 300, "serial": tourney_serial, "sit_n_go": "y", "registered": 0};
	var prizes = [{"serial": 1, "name": "prize 1", "image_url": "url1"}, {"serial": 2, "name": "prize 2", "image_url": "url2"}];

	var expected = ['SELECT+*+FROM+prizes', 'SELECT+p.serial+FROM+prizes', 'ON+DUPLICATE+KEY+UPDATE', 'ON+DUPLICATE+KEY+UPDATE'];
	var results = [prizes, [], 1, 2];

	var options = {
	    ajax: function(params) {
		equals(params.url.indexOf('URL'), 0, params.url);
		ok(params.url.indexOf(expected.shift()) >= 0, params.url);
		params.success(results.shift(), 'success');
	    },
	    callback: {
		display_done: function(e) {
		    equals($('select[name=serial] option', e).length, 2);
		    equals($('select[name=serial] option', e).eq(0).text(), 'prize 1');
		    equals($('select[name=serial] option', e).eq(1).text(), 'prize 2');
		}
	    }
	};

	$.jpoker.tourneyAdminEditPrizes('URL', tourney, options);
	equals($('#jpokerAdminEdit').length, 1, 'admin edit dialog');
	equals($('#jpokerAdminEditPrizes').length, 1, 'admin edit prizes');
	equals($('#jpokerAdminEditPrizes .jpoker_prize img').attr('src'),  'url1');
	$('#jpokerAdminEditPrizes select[name=serial]').val('2').change();
	equals($('#jpokerAdminEditPrizes .jpoker_prize img').attr('src'),  'url2');
	
	cleanup();
    });
