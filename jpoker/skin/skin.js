/***
|''Name:''|skin|
|''Description:''||
|''Author:''|Loic Dachary (loic@dachary.org)|
|''Source:''|http://jspoker.pokersource.info/jpoker/skin.html#skin.js|
|''Code Repository:''|http://upstream.jspoker.pokersource.info/|
|''Version:''|1.0|
|''Date:''|May 5, 2008|
|''License:''|[[GNU GPLv3+|http://gnu.org/licenses/gpl.txt]]|
|''~CoreVersion:''|2.3.0|
***/
//{{{

config.options.chkSinglePagePermalink = false;

config.macros.jpoker_01_copyright = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_01_copyright(place);
    }
};

config.macros.jpokerLogin = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpokerLogin(place);
    }
};

config.macros.jpokerServerStatus = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpokerServerStatus(place);
    }
};

config.macros.jpokerTableList = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpokerTableList(place);
    }
};

config.macros.jpoker_02_join = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_02_join(place);
    }
};

config.macros.jpoker_03_joinBuyIn = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_03_joinBuyIn(place);
    }
};

config.macros.jpoker_03_playerBet = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_03_playerBet(place);
    }
};

config.macros.jpoker_04_playerInPosition = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_04_playerInPosition(place);
    }
};

config.macros.jpoker_05_selfPlayer = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_05_selfPlayer(place);
    }
};

config.macros.jpoker_06_selfInPosition = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_06_selfInPosition(place);
    }
};

config.macros.jpoker_07_joining = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_07_joining(place);
    }
};

config.macros.jpoker_08_all = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_08_all(place);
    }
};

config.macros.jpoker_09_dialog = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_09_dialog(place);
    }
};

config.macros.jpoker_20_login = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_20_login(place);
    }
};

config.macros.jpoker_21_loginProgress = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_21_loginProgress(place);
    }
};

config.macros.jpoker_22_logout = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_22_logout(place);
    }
};

config.macros.jpoker_30_statusDisconnected = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_30_statusDisconnected(place);
    }
};

config.macros.jpoker_31_connectedTables = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_31_connectedTables(place);
    }
};

config.macros.jpoker_32_connectedTablesPlayers = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_32_connectedTablesPlayers(place);
    }
};

config.macros.jpoker_40_tableList = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_40_tableList(place);
    }
};

config.macros.jpoker_50_sitOut = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_50_sitOut(place);
    }
};

config.macros.jpoker_51_sit = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_51_sit(place);
    }
};

config.macros.jpoker_52_inPosition = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
	jpoker_52_inPosition(place);
    }
};

//Local Variables:
//compile-command: " ( cd ../.. ; OFFLINE=yes make skin_tests cook ) ; ( cd .. ; x-www-browser skin.html )"
//End:
//}}}
//!END-PLUGIN-CODE
// %/
