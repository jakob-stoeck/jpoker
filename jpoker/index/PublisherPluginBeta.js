/***
|''Name:''|PublisherPlugin|
|''Description:''||
|''Author:''|Saq Imtiaz ( lewcid@gmail.com )|
|''Source:''|http://tw.lewcid.org/#PublisherPlugin|
|''Code Repository:''|http://tw.lewcid.org/svn/plugins|
|''Version:''|2.0|
|''Date:''||
|''License:''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]]|
|''~CoreVersion:''|2.2.3|
!!Usage:
* PublisherPluginGuide

***/
//{{{
config.macros.publisher = {
	
	modes:{
	},
	
	startMode : 'Public',
	
	currentMode : '',
	
	defaults: [
		{name: "StyleSheet", notify: refreshStyles},
		{name: "PageTemplate", notify: refreshPageTemplate}
	],
	
	tiddlerTemplates : merge({},config.tiddlerTemplates),
	
	applyMode : function (newMode){
		var oldMode = this.currentMode;
		var oldStyleElement = document.getElementById(oldMode+"StyleSheet");
		if (oldStyleElement){
			oldStyleElement.parentNode.removeChild(oldStyleElement);
		}
		for (var i=0; i< this.defaults.length; i++){
			var name = this.defaults[i]["name"];
			var newElement = store.isTiddler(newMode + name) ? newMode + name : name;
			store.removeNotification(oldMode + name, this.defaults[i]["notify"]);
			store.addNotification(newElement,this.defaults[i]["notify"]);
			store.notify(newElement); 
		}
		
		this.currentMode = newMode;
		this.switchTemplates();
		this.toggleReadOnly();
		this.toggleBackstage();
		this.toggleSPM();
		refreshDisplay();
		story.publisherRefreshAllTiddlers();
	},

	switchTemplates : function(){
		for (var n in this.tiddlerTemplates){
			config.tiddlerTemplates[n] = store.detectTiddler(this.currentMode,this.tiddlerTemplates[n]);
		}
	},
	
	toggleBackstage :function(){
		if (this.modes[this.startMode]['backstage']){
			if (backstage && backstage.button){
				//if(readOnly)backstage.init();
				backstage.button.style.display = "block";
				backstage.show();
			}
		}
		else if (backstage && backstage.button){
			backstage.button.style.display = "none";
			backstage.hide();
		}
	},
	
	toggleReadOnly : function(){
		if (this.modes[this.currentMode]['readOnly']){
			config.options.chkHttpReadOnly = true;
			readOnly = true;
			//refreshDisplay();
		}
		else{
			config.options.chkHttpReadOnly =false;
			readOnly = false;
			//refreshDisplay();
		}
	},
	
	toggleSPM : function(){
		config.options.chkSinglePageMode = (this.modes[this.currentMode]['SPM'])? true : false;
		config.options.chkTopOfPageMode = (this.modes[this.currentMode]['SPM'])? true : false;
	},
	
	loadDb : function(){
		var modelines = store.getTiddlerText("PublisherGroupsConfig").split("\n");
		for (i=1; i<modelines.length; i++){
			var modeparts = modelines[i].split("|");
			this.modes[modeparts[1]] = {readOnly:eval(modeparts[2]),backstage:eval(modeparts[3]),SPM:eval(modeparts[4])};
		}
	},
	
	init: function(){
		this.loadDb();
		this.applyMode(this.startMode);
	},
	
	handler: function(place,macroName,params,wikifier,paramString,tiddler){
		if (!this.modes[this.startMode]['readOnly'] || params[0]=='force'){
			choices = [];
			if (params[1]){
				var modes = params[1].readBracketedList();
				for (var i=0;i<modes.length;i++){
					choices.push({name:modes[i],caption:modes[i]+' mode'});
				}
			}
			else{
				for (var n in this.modes){
					choices.push({name:n,caption:n+' mode'});
				}
			}
			createTiddlyDropDown(place,this.onchangeselect,choices,this.currentMode);
		}
	},

	onchangeselect : function(e){
		config.macros.publisher.applyMode(this.value);
	}
	
};

config.paramifiers.mode = {
	onconfig: function(mode) {
		config.macros.publisher.startMode = mode;	
	}
};

backstage.old_publisher_init = backstage.init;
backstage.init = function(){
	this.old_publisher_init.apply(this,arguments);
	wikify("<<publisher>>",document.getElementById("backstageToolbar"));
};

TiddlyWiki.prototype.isTiddler= function (title) {
	return store.tiddlerExists(title) || store.isShadowTiddler(title);
};

TiddlyWiki.prototype.detectTiddler= function(prefix,title)
{
	return (this.isTiddler(prefix+title)? prefix+title : title);	
}

TiddlyWiki.prototype.removeNotification = function(title,fn) {
	for (var i=0;i<this.namedNotifications.length;i++){
		if((this.namedNotifications[i].name == title) && (this.namedNotifications[i].notify == fn))
	 		this.namedNotifications.splice(i,1);
	}
};

TiddlyWiki.prototype.publisherGetTiddlerText = TiddlyWiki.prototype.getTiddlerText;
TiddlyWiki.prototype.getTiddlerText = function(title,defaultText){
    if (title == 'DefaultTiddlers' && startingUp){
        title = store.isTiddler(config.macros.publisher.startMode + title) ? config.macros.publisher.startMode + title: title;
    }
	return store.publisherGetTiddlerText(title,defaultText);
};

Story.prototype.publisherRefreshAllTiddlers = function() {
	var place = document.getElementById(this.container);
 	var e = place.firstChild;
 	if(!e) return;
 	this.refreshTiddler(e.getAttribute("tiddler"),null,true);
 	while((e = e.nextSibling) != null)
 		this.refreshTiddler(e.getAttribute("tiddler"),null,true);
};

config.shadowTiddlers.PublisherGroupsConfig = "|!Name|!ReadOnly|!Backstage|!SPM|\n|Admin|false|true|false|\n|Public|true|false|true|\n|User|false|false|true|";

config.shadowTiddlers.MainMenu += "<<publisher>>";
config.shadowTiddlers.AdminStyleSheet =		"[[StyleSheet]]";  	//config.shadowTiddlers.StyleSheet;
config.shadowTiddlers.AdminPageTemplate = 	"[[PageTemplate]]";//config.shadowTiddlers.PageTemplate;
config.shadowTiddlers.AdminViewTemplate = 	"[[ViewTemplate]]";//config.shadowTiddlers.ViewTemplate;
config.shadowTiddlers.AdminEditTemplate = 	"[[EditTemplate]]";//config.shadowTiddlers.EditTemplate;

config.shadowTiddlers.PublicViewTemplate = "<!--{{{-->\n<div class='title' macro='view title'></div>\n<div class='viewer' macro='view text wikified'></div>\n<div class='tagClear'></div>\n<!--}}}-->";
config.shadowTiddlers.PublicStyleSheet = "/*{{{*/\n[[StyleSheet]]\n\n#displayArea {margin-right:1em;}\n\n.admin {display:none;}\n\n/*}}}*/";
config.shadowTiddlers.PublicPageTemplate = store.getTiddlerText("PageTemplate").replace("\n<div id='sidebar'>\n<div id='sidebarOptions' refresh='content' tiddler='SideBarOptions'></div>\n<div id='sidebarTabs' refresh='content' force='true' tiddler='SideBarTabs'></div>\n</div>","");
//}}}
//!END-PLUGIN-CODE
// %/