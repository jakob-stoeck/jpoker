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

var USER_INFO_PACKET = {"rating":1000,"name":"proppy","money":{"X1":[100000,10000,0], "X2":[200000,20000,0]},"affiliate":0,"cookie":"","serial":4,"password":"","type":"PacketPokerUserInfo","email":"","uid__":"jpoker1220102037582"};
mockupServer({packet: USER_INFO_PACKET, serial: 42});

$(document).ready(function() {	
	$.jpoker.plugins.cashier.templates.currencies.header = '<ul class=\'jpoker_cashier_currencies\'>';
	$.jpoker.plugins.cashier.templates.currencies.rows = '<li class=\'jpoker_cashier_currency jpoker_cashier_currency_{currency_serial}\'>Cash: {currency_amount}$ ({currency_ingame}$ still in game)</li>';
	$.jpoker.plugins.cashier.templates.currencies.footer = '</ul>';
	$('#cashier').jpoker('cashier', 'url');
    });

