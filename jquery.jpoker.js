//
// Copyright (C) 2007 Johan Euphrosine <proppy@aminche.com>
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301, USA.
//

(function($) {

$.fn.extend({
	jPokerRefreshTables: function()
	{
		var selector = this;
		$.post("proxy.php", {'type': 'PacketPokerTableSelect', 'string': ''}, function(data) {
			var packets = eval(data);
			var packet = packets[0];
			var tables = packet.packets;
			selector.each(function() {
				$(this).children(".jPokerTables").remove();
				var parent = $("<table>").addClass("jPokerTables").addClass("tablesorter").appendTo(this);
				var head = $("<thead>").appendTo(parent);
				var tr = $("<tr>").appendTo(head)
						  .append("<th>Name</th>")
						  .append("<th>Players</th>")
						  .append("<th>Seats</th>")
						  .append("<th>Betting Structure</th>")
						  .append("<th>Average Pot</th>")
						  .append("<th>Hands/Hour</th>")
						  .append("<th>% Flop</th>");
				var body = $("<tbody>").appendTo(parent);
				$.each(tables, function() {
					$("<tr class='table'>").appendTo(body)
							       .append("<td>" + this.name + "</td>")
							       .append("<td>" + this.players + "</td>")
							       .append("<td>" + this.seats + "</td>")
							       .append("<td>" + this.betting_structure + "</td>")
							       .append("<td>" + this.average_pot + "</td>")
							       .append("<td>" + this.hands_per_hour + "</td>")
							       .append("<td>" + this.percent_flop + "</td>");
				});
			});
		});
		return this;
	},
	
	jPokerRefreshTourneys: function()
	{
		var selector = this;
		$.post("proxy.php", {'type': 'PacketPokerTourneySelect', 'string': ''}, function(data) {
			var packets = eval(data);
			var packet = packets[0];
			var tourneys = packet.packets;
			selector.each(function() {
				$(this).children(".jPokerTourneys").remove();
				var parent = $("<table>").addClass("jPokerTourneys").addClass("tablesorter").appendTo(this);
				var head = $("<thead>").appendTo(parent);
				var tr = $("<tr>").appendTo(head)
						  .append("<th>Description</th>")
						  .append("<th>Registered</th>")
						  .append("<th>Players Quota</th>")
						  .append("<th>State</th>");
				var body = $("<tbody>").appendTo(parent);
				$.each(tourneys, function() {
					$("<tr class='tourney'>").appendTo(body)
							       .append("<td>" + this.description_short + "</td>")
							       .append("<td>" + this.registered + "</td>")
							       .append("<td>" + this.players_quota + "</td>")
							       .append("<td>" + this.state + "</td>");
				});
			});
		});
		return this;
	}
});

})(jQuery);
