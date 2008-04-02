/***
|''Name:''|WebDAVSavingPlugin|
|''Description:''|Saves on a WebDAV server without the need of any ServerSide script.<br>When TiddlyWiki is accessed over http, this plugin permits to save back to the server, using http PUT.|
|''Version:''|0.2.1|
|''Date:''|Apr 21, 2007|
|''Source:''|http://tiddlywiki.bidix.info/#WebDAVSavingPlugin|
|''Author:''|BidiX (BidiX (at) bidix (dot) info)|
|''License:''|[[BSD open source license|http://tiddlywiki.bidix.info/#%5B%5BBSD%20open%20source%20license%5D%5D ]]|
|''~CoreVersion:''|2.2.0 (Beta 5)|
***/
//{{{
version.extensions.WebDAVSavingPlugin = {
	major: 0, minor: 2, revision: 1, 
	date: new Date("Apr 21, 2007"),
	source: 'http://tiddlywiki.bidix.info/#WebDAVSavingPlugin',
	author: 'BidiX (BidiX (at) bidix (dot) info',
	license: '[[BSD open source license|http://tiddlywiki.bidix.info/#%5B%5BBSD%20open%20source%20license%5D%5D]]',
	coreVersion: '2.2.0 (Beta 5)'
};

if (!window.bidix) window.bidix = {};
bidix.WebDAVSaving = {
	orig_saveChanges: saveChanges,
	defaultFilename: 'index.html',
	messages: {
		loadOriginalHttpDavError: "Original file can't be loaded",
		optionsMethodError: "The OPTIONS method can't be used on this ressource : %0",
		webDavNotEnabled: "WebDAV is not enabled on this ressource : %0",
		notHTTPUrlError: "WebDAV saving can be used for http viewed TiddlyWiki only",
		aboutToSaveOnHttpDav: 'About to save on %0 ...'		,
		folderCreated: "Remote folder '%0' created"
	}
};

// Save this tiddlywiki with the pending changes
saveChanges = function(onlyIfDirty,tiddlers)
{
	var originalPath = document.location.toString();
	if (originalPath.substr(0,5) == "file:")
		return bidix.WebDAVSaving.orig_saveChanges(onlyIfDirty,tiddlers);
	else
		return bidix.WebDAVSaving.saveChanges(onlyIfDirty,tiddlers);
}

bidix.WebDAVSaving.saveChanges = function(onlyIfDirty,tiddlers)
{
	var callback = function(status,params,original,url,xhr) {
			url = (url.indexOf("nocache=") < 0 ? url : url.substring(0,url.indexOf("nocache=")-1));
		if (!status)
			displayMessage(bidix.WebDAVSaving.messages.optionsMethodError.format([url]));
		else {
			if (!xhr.getResponseHeader("DAV"))
				alert(bidix.WebDAVSaving.messages.webDavNotEnabled.format([url]));
			else
				bidix.WebDAVSaving.doSaveChanges();
		}
	}	
	if(onlyIfDirty && !store.isDirty())
		return;
	clearMessage();
	var originalPath = document.location.toString();
	// Check we were loaded from a HTTP or HTTPS URL
	if(originalPath.substr(0,4) != "http") {
		alert(bidix.WebDAVSaving.messages.notHTTPUrlError);
		return;
	}	
	// is the server WebDAV enabled ?
	var r = doHttp("OPTIONS",originalPath,null,null,null,null,callback,null,null);
	if (typeof r == "string")
		alert(r);
}
	
bidix.WebDAVSaving.doSaveChanges = function()
{
	var callback = function(status,params,original,url,xhr) {
		if (!status) {
			alert(config.messages.loadOriginalHttpDavError);
			return;
		}
		url = (url.indexOf("nocache=") < 0 ? url : url.substring(0,url.indexOf("nocache=")-1));
		// Locate the storeArea div's 
		var posDiv = locateStoreArea(original);
		if((posDiv[0] == -1) || (posDiv[1] == -1)) {
			alert(config.messages.invalidFileError.format([localPath]));
			return;
		}
		bidix.WebDAVSaving.mkbackupfolder(null,null,params,original,posDiv);
	};
	// get original
	var originalPath = document.location.toString();
	if (originalPath.charAt(originalPath.length-1) == "/")
		originalPath = originalPath + bidix.WebDAVSaving.defaultFilename;
	displayMessage(bidix.WebDAVSaving.messages.aboutToSaveOnHttpDav.format([originalPath]));
	doHttp("GET",originalPath,null,null,null,null,callback,originalPath,null);
};

bidix.WebDAVSaving.mkbackupfolder = function(root,dirs,url,original,posDiv) {
	if (!root || !dirs) {
		root = bidix.dirname(url);
		if (config.options.txtBackupFolder == "")
			dirs = null;
		else
			dirs = config.options.txtBackupFolder.split('/');
	}
	if (config.options.chkSaveBackups && dirs && (dirs.length > 0)) 
		bidix.WebDAVSaving.mkdir(root,dirs.shift(),dirs,url,original,posDiv);
	else
		bidix.WebDAVSaving.saveBackup(url,original,posDiv);
};

bidix.WebDAVSaving.saveBackup = function(url,original,posDiv)
{
	var callback = function(status,params,responseText,url,xhr) {
		if (!status) {
			alert(config.messages.backupFailed);
			return;
		}
		url = (url.indexOf("nocache=") < 0 ? url : url.substring(0,url.indexOf("nocache=")-1));
		displayMessage(config.messages.backupSaved,url);
		bidix.WebDAVSaving.saveRss(params[0],params[1],params[2]);
	};
	if(config.options.chkSaveBackups) {
		var backupPath = getBackupPath(url);
		bidix.httpPut(backupPath,original,callback,Array(url,original,posDiv));
	} else {
		bidix.WebDAVSaving.saveRss(url,original,posDiv);
	}
}

bidix.WebDAVSaving.saveRss = function(url,original,posDiv) 
{
	var callback = function(status,params,responseText,url,xhr) {
		if (!status) {
			alert(config.messages.rssFailed);
			return;
		}
		url = (url.indexOf("nocache=") < 0 ? url : url.substring(0,url.indexOf("nocache=")-1));
		displayMessage(config.messages.rssSaved,url);
		bidix.WebDAVSaving.saveEmpty(params[0],params[1],params[2]);
	};
	if(config.options.chkGenerateAnRssFeed) {
		var rssPath = url.substr(0,url.lastIndexOf(".")) + ".xml";
		bidix.httpPut(rssPath,convertUnicodeToUTF8(generateRss()),callback,Array(url,original,posDiv));
	} else {
		bidix.WebDAVSaving.saveEmpty(url,original,posDiv);
	}
}

bidix.WebDAVSaving.saveEmpty = function(url,original,posDiv) 
{
	var callback = function(status,params,responseText,url,xhr) {
		if (!status) {
			alert(config.messages.emptyFailed);
			return;
		}
		url = (url.indexOf("nocache=") < 0 ? url : url.substring(0,url.indexOf("nocache=")-1));
		displayMessage(config.messages.emptySaved,url);
		bidix.WebDAVSaving.saveMain(params[0],params[1],params[2]);
	};
	if(config.options.chkSaveEmptyTemplate) {
		var emptyPath,p;
		if((p = url.lastIndexOf("/")) != -1)
			emptyPath = url.substr(0,p) + "/empty.html";
		else
			emptyPath = url + ".empty.html";
		var empty = original.substr(0,posDiv[0] + startSaveArea.length) + original.substr(posDiv[1]);
		bidix.httpPut(emptyPath,empty,callback,Array(url,original,posDiv));
	} else {
		bidix.WebDAVSaving.saveMain(url,original,posDiv);
	}
}

bidix.WebDAVSaving.saveMain = function(url,original,posDiv) 
{
	var callback = function(status,params,responseText,url,xhr) {
		if(status) {
			url = (url.indexOf("nocache=") < 0 ? url : url.substring(0,url.indexOf("nocache=")-1));
			displayMessage(config.messages.mainSaved,url);
			store.setDirty(false);
		} else 
			alert(config.messages.mainFailed);
	};	
	// Save new file
	var revised = updateOriginal(original,posDiv);
	bidix.httpPut(url,revised,callback,null);
}

// asynchronous mkdir
bidix.WebDAVSaving.mkdir = function(root,dir,dirs,url,original,posDiv) {
	var callback = function(status,params,responseText,url,xhr) {
		url = (url.indexOf("nocache=") < 0 ? url : url.substring(0,url.indexOf("nocache=")-1));
		if (status == null) {
			alert("Error in mkdir");
			return;
		}
		if (xhr.status == httpStatus.ContentCreated) {
			displayMessage(bidix.WebDAVSaving.messages.folderCreated.format([url]),url);
			bidix.WebDAVSaving.mkbackupfolder(url,params[1],params[2],params[3],params[4]);
		} else {
			if (xhr.status == httpStatus.NotFound)
				bidix.http('MKCOL',url,null,callback,params);
			else
				bidix.WebDAVSaving.mkbackupfolder(url,params[1],params[2],params[3],params[4]);
		}
	};
	if (root.charAt(root.length) != '/')
		root = root +'/';
	bidix.http('HEAD',root+dir,null,callback,Array(root,dirs,url,original,posDiv));
}

bidix.httpPut = function(url,data,callback,params)
{
	return bidix.http("PUT",url,data,callback,params);
}

bidix.http = function(type,url,data,callback,params)
{
	var r = doHttp(type,url,data,null,null,null,callback,params,null);
	if (typeof r == "string")
		alert(r);
	return r;
}

bidix.dirname = function (filePath) {
	if (!filePath) 
		return;
	var lastpos;
	if ((lastpos = filePath.lastIndexOf("/")) != -1) {
		return filePath.substring(0, lastpos);
	} else {
		return filePath.substring(0, filePath.lastIndexOf("\\"));
	}
};
//}}}