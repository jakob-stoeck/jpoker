/***
|Name|SinglePageModePlugin|
|Source|http://www.TiddlyTools.com/#SinglePageModePlugin|
|Version|2.3.1|
|Author|Eric Shulman - ELS Design Studios|
|License|http://www.TiddlyTools.com/#LegalStatements <<br>>and [[Creative Commons Attribution-ShareAlike 2.5 License|http://creativecommons.org/licenses/by-sa/2.5/]]|
|~CoreVersion|2.1|
|Type|plugin|
|Requires||
|Overrides|Story.prototype.displayTiddler(), Story.prototype.displayTiddlers()|
|Description|Display tiddlers one at a time with automatic update of URL (permalink).  Also, options to always open tiddlers at top/bottom of page|

Normally, as you click on the links in TiddlyWiki, more and more tiddlers are displayed on the page. The order of this tiddler display depends upon when and where you have clicked. Some people like this non-linear method of reading the document, while others have reported that when many tiddlers have been opened, it can get somewhat confusing.

!!!!!Usage
<<<
SinglePageMode allows you to configure TiddlyWiki to navigate more like a traditional multipage web site with only one item displayed at a time.  When SinglePageMode is enabled, the title of the current tiddler is automatically displayed in the browser window's titlebar and the browser's location URL is updated with a 'permalink' for the current tiddler so that it is easier to create a browser 'bookmark' for the current tiddler.

Even when SinglePageMode is disabled (i.e., displaying multiple tiddlers is permitted), you can reduce the potential for confusion by enable TopOfPageMode, which forces tiddlers to always open at the top of the page instead of being displayed following the tiddler containing the link that was clicked.
<<<
!!!!!Configuration
<<<
When installed, this plugin automatically adds checkboxes in the AdvancedOptions tiddler so you can enable/disable the plugin behavior.  For convenience, these checkboxes are also included here:

<<option chkSinglePageMode>> Display one tiddler at a time
<<option chkTopOfPageMode>> Always open tiddlers at the top of the page
<<option chkBottomOfPageMode>> Always open tiddlers at the bottom of the page
//(note: if both settings are selected, "top of page" is used)//
<<<
!!!!!Installation
<<<
import (or copy/paste) the following tiddlers into your document:
''SinglePageModePlugin'' (tagged with <<tag systemConfig>>)
^^documentation and javascript for SinglePageMode handling^^

When installed, this plugin automatically adds checkboxes in the ''shadow'' AdvancedOptions tiddler so you can enable/disable this behavior.  However, if you have customized your AdvancedOptions, you will need to ''manually add these checkboxes to your customized tiddler.''
<<<
!!!!!Revision History
<<<
''2007.03.03 [2.3.1]'' fix typo when adding BPM option to AdvancedOptions (prevented checkbox from appearing)
''2007.03.03 [2.3.0]'' added support for BottomOfPageMode (BPM) based on request from DaveGarbutt
''2007.02.06 [2.2.3]'' in Story.prototype.displayTiddler(), use convertUnicodeToUTF8() for correct I18N string handling when creating URL hash string from tiddler title (based on bug report from BidiX)
''2007.01.08 [2.2.2]'' use apply() to invoke hijacked core functions
''2006.07.04 [2.2.1]'' in hijack for displayTiddlers(), suspend TPM as well as SPM so that DefaultTiddlers displays in the correct order.
''2006.06.01 [2.2.0]'' added chkTopOfPageMode (TPM) handling
''2006.02.04 [2.1.1]'' moved global variable declarations to config.* to avoid FireFox 1.5.0.1 crash bug when assigning to globals
''2005.12.27 [2.1.0]'' hijack displayTiddlers() so that SPM can be suspended during startup while displaying the DefaultTiddlers (or #hash list).  Also, corrected initialization for undefined SPM flag to "false", so default behavior is to display multiple tiddlers
''2005.12.27 [2.0.0]'' Update for TW2.0
''2005.11.24 [1.1.2]'' When the back and forward buttons are used, the page now changes to match the URL.  Based on code added by Clint Checketts
''2005.10.14 [1.1.1]'' permalink creation now calls encodeTiddlyLink() to handle tiddler titles with spaces in them
''2005.10.14 [1.1.0]'' added automatic setting of window title and location bar ('auto-permalink').  feature suggestion by David Dickens.
''2005.10.09 [1.0.1]'' combined documentation and code in a single tiddler
''2005.08.15 [1.0.0]'' Initial Release
<<<
!!!!!Credits
<<<
This feature was developed by EricShulman from [[ELS Design Studios|http:/www.elsdesign.com]].
Support for BACK/FORWARD buttons adapted from code developed by Clint Checketts
<<<
!!!!!Code
***/
//{{{
version.extensions.SinglePageMode= {major: 2, minor: 3, revision: 1, date: new Date(2007,3,3)};

if (config.options.chkSinglePageMode==undefined) config.options.chkSinglePageMode=false;
config.shadowTiddlers.AdvancedOptions += "\n<<option chkSinglePageMode>> Display one tiddler at a time";

if (config.options.chkTopOfPageMode==undefined) config.options.chkTopOfPageMode=false;
config.shadowTiddlers.AdvancedOptions += "\n<<option chkTopOfPageMode>> Always open tiddlers at the top of the page";

if (config.options.chkBottomOfPageMode==undefined) config.options.chkBottomOfPageMode=false;
config.shadowTiddlers.AdvancedOptions += "\n<<option chkBottomOfPageMode>> Always open tiddlers at the bottom of the page";

config.SPMTimer = 0;
config.lastURL = window.location.hash;
function checkLastURL()
{
	if (!config.options.chkSinglePageMode)
		{ window.clearInterval(config.SPMTimer); config.SPMTimer=0; return; }
	if (config.lastURL == window.location.hash)
		return;
	var tiddlerName = convertUTF8ToUnicode(decodeURI(window.location.hash.substr(1)));
	tiddlerName=tiddlerName.replace(/\[\[/,"").replace(/\]\]/,""); // strip any [[ ]] bracketing
	if (tiddlerName.length) story.displayTiddler(null,tiddlerName,1,null,null);
}

if (Story.prototype.SPM_coreDisplayTiddler==undefined) Story.prototype.SPM_coreDisplayTiddler=Story.prototype.displayTiddler;
Story.prototype.displayTiddler = function(srcElement,title,template,animate,slowly)
{
	if (config.options.chkSinglePageMode) {
		window.location.hash = encodeURIComponent(convertUnicodeToUTF8(String.encodeTiddlyLink(title)));
		config.lastURL = window.location.hash;
		document.title = wikifyPlain("SiteTitle") + " - " + title;
		story.closeAllTiddlers();
		if (!config.SPMTimer) config.SPMTimer=window.setInterval(function() {checkLastURL();},1000);
	}
	if (config.options.chkTopOfPageMode) { story.closeTiddler(title); srcElement=null; }
	else if (config.options.chkBottomOfPageMode) { story.closeTiddler(title); srcElement="bottom"; }
	this.SPM_coreDisplayTiddler.apply(this,arguments);
	if (config.options.chkTopOfPageMode) window.scrollTo(0,0); // make sure top of page is visible
	else if (config.options.chkBottomOfPageMode) {
		var display=document.getElementById("tiddlerDisplay"); // for TW2.1-
		if (!display) var display=document.getElementById("storyDisplay"); // for TW2.2+
		window.scrollTo(0,ensureVisible(display.lastChild)); // make sure last tiddler is visible
	}
}

if (Story.prototype.SPM_coreDisplayTiddlers==undefined) Story.prototype.SPM_coreDisplayTiddlers=Story.prototype.displayTiddlers;
Story.prototype.displayTiddlers = function(srcElement,titles,template,unused1,unused2,animate,slowly)
{
	// suspend single-page mode (and/or top/bottom display options) when showing multiple tiddlers
	var saveSPM=config.options.chkSinglePageMode; config.options.chkSinglePageMode=false;
	var saveTPM=config.options.chkTopOfPageMode; config.options.chkTopOfPageMode=false;
	var saveBPM=config.options.chkBottomOfPageMode; config.options.chkBottomOfPageMode=false;
	this.SPM_coreDisplayTiddlers.apply(this,arguments);
	config.options.chkBottomOfPageMode=saveBPM;
	config.options.chkTopOfPageMode=saveTPM;
	config.options.chkSinglePageMode=saveSPM;
}
//}}}