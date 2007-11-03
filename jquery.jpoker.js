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
				var parent = $("<table id='tables'>").appendTo(selector);
				$("<thead><tr><th>Name</th></tr></thread>").appendTo(parent);
				var body = $("<tbody>").appendTo(parent);
				$.each(tables, function() {
					$("<tr class='table'><td>" + this.name + "</td></tr>").appendTo(body);
				});
				$("#tables").tablesorter();
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
				var parent = $("<table id='tourneys'>").appendTo(selector);
				$("<tr><th>Name</th></tr>").appendTo(parent);
				var body = $("<tbody>").appendTo(parent);
				$.each(tourneys, function() {
					$("<tr class='tourney'><td>" + this.name + "</td></tr>").appendTo(body);
				});
				$("#tourneys").tablesorter();
			});
		});
		return this;
	}
});

})(jQuery);
