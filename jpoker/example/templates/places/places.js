//
//     Copyright (C) 2009 Johan Euphrosine <proppy@aminche.com>
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

var mockupServer  = function(options) {
    var PokerServer = function() {};
    var server = $.jpoker.url2server('url');
    PokerServer.prototype = {
	outgoing: "[ " + JSON.stringify(options.packet) + " ]",
	handle: function(packet) { }
    };
    ActiveXObject.prototype.server = new PokerServer();
    server.serial = options.serial;
};

var PLAYER_PLACES_PACKET = {type: 'PacketPokerPlayerPlaces', serial: 42, tables: [11, 12, 13], tourneys: [21, 22]};
mockupServer({packet: PLAYER_PLACES_PACKET, serial: 42});

$(document).ready(function() {
	$.jpoker.plugins.places.templates.tables.header = '<div class=\'jpoker_places_tables\'>You are still seated at the following tables:'
	$.jpoker.plugins.places.templates.tables.rows = '<span class=\'jpoker_places_table\'>{table}</span>';
	$.jpoker.plugins.places.templates.tables.footer = '(click "EXIT" to leave table)</div>';
	var table_link_pattern = 'http://foo.com/table?game_id={game_id}';
	$('#places').jpoker('places', 'url', {table_link_pattern: table_link_pattern});
    });

