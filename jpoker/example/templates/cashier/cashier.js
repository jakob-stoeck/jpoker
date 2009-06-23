var mockupPacket  = function(options) {	
    var PokerServer = function() {};
    PokerServer.prototype = {
	outgoing: "[ " + JSON.stringify(options.packet) + " ]",
	handle: function(packet) { }
    };
    ActiveXObject.prototype.server = new PokerServer();
    
};

var mockupLogin = function(options) {
    var server = $.jpoker.url2server('url');
    server.serial = options.serial;
};

var USER_INFO_PACKET = {"rating":1000,"name":"proppy","money":{"X1":[100000,10000,0], "X2":[200000,20000,0]},"affiliate":0,"cookie":"","serial":4,"password":"","type":"PacketPokerUserInfo","email":"","uid__":"jpoker1220102037582"};
mockupPacket({packet: USER_INFO_PACKET});
mockupLogin({serial: 42});

$(document).ready(function() {	
	$.jpoker.plugins.cashier.templates.currencies.header = '<ul class=\'jpoker_cashier_currencies\'>';
	$.jpoker.plugins.cashier.templates.currencies.rows = '<li class=\'jpoker_cashier_currency jpoker_cashier_currency_{currency_serial}\'>Cash: {currency_amount}$ ({currency_ingame}$ still in game)</li>';
	$.jpoker.plugins.cashier.templates.currencies.footer = '</ul>';
	var cashier = $('#cashier').jpoker('cashier', 'url');
    });

