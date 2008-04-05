/***
|''Name:''|TiddlyLightBox|
|''Date:''|Jan 1, 2006|
|''Version:''|1.0 beta|
|''Author:''|Saq Imtiaz|
|''Location:''|http://tw.lewcid.org/#TiddlyLightBoxPlugin|
|''Documentation:''|http://tw.lewcid.org/#TiddlyLightBoxDocs|
|''License:''|[[Creative Commons Attribution-ShareAlike 3.0 License|http://creativecommons.org/licenses/by-sa/3.0/]]|
|''Based on:''|DC3.LightBox<br>Light Box Gone Wild <br>Ibox|

!!Code
***/
//{{{
config.macros.imagebox ={};
config.macros.imagebox.handler = function (place,macroName,params,wikifier,paramString,tiddler)
{
    var e = place.lastChild;
    e.onclick = function(){TiddlyLightBox.initBox('image',this,params[1],params[2],params[0]);return false;};
}

config.macros.divbox ={};
config.macros.divbox.handler = function (place,macroName,params,wikifier,paramString,tiddler)
{
    if (params[0]!=".")
        createTiddlyButton(place,params[0],params[0],function(){TiddlyLightBox.initBox('html',params[1],params[3],params[4],params[2]);return false;});
    else
        {
        var e = place.lastChild;
        e.onclick = function(){TiddlyLightBox.initBox('html',params[1],params[3],params[4],params[2]);return false;};
        }
}

config.macros.tiddlerbox ={}
config.macros.tiddlerbox.handler = function (place,macroName,params,wikifier,paramString,tiddler)
{
    config.macros.divbox.handler(place,macroName,[params[0],"tiddler:"+params[1],params[2],params[3],params[4]]);
    return false;
}

store.addNotification("TiddlyLightBoxStyles",refreshStyles);

if (!window.TiddlyLightBox)
    window.TiddlyLightBox = {};
    var loadingImage = "indicator.gif";
    window.TiddlyLightBox =
    {
    _curBox: null, // [sentinel]

    lightBoxHtml : '<div id="lightBoxOverlay" onclick="TiddlyLightBox.hideBox()" style="display:none"></div><div id="lightboxprogress" style="display:none;"><img src=\''+loadingImage+'\' alt=\'loading\' style="width:128px;height:128px;"></div><div class="lightBox" id="lightBox" style="display:none"><div id="lightBoxContent"></div><div id="lightBoxTitle">This is a title</div><div id="lightBoxClose"><a href:"#" onclick="TiddlyLightBox.hideBox();return false;">Click to close</a></div></div>',

    createBoxWrapper : function()
        {
        var wrapper = createTiddlyElement(document.getElementsByTagName("body")[0],"div","tiddlyLightBoxWrapper");
        wrapper.innerHTML = this.lightBoxHtml;
        },

    initBox : function(contentType,url,w,h,text)
        {
        if (this._curBox)
            return;
        this.showProgress();
        this.hideSelects("hidden");
        this.showBg();
        this._curBox = true;
        this.sizeTheBox(contentType,w,h);
        if (contentType == 'image')
            this.showImage(url,text);
        else if (contentType == 'html')
            this.showHtml(url,text);
        return false;
        },
        
    sizeTheBox : function(contentType,w,h)
        {
        var box = document.getElementById("lightBoxContent");
        if (w && isNaN(parseInt(w)))
            {
            addClass(box,w);
            }
        else if (w ||h || contentType == 'html')
            {
            box.style.width = w? w+ "px" : "450px";
            box.style.height = h? h+ "px" : "280px";
            if (contentType=='image')
                setStylesheet("#lightBoxContent img{height:100%;width:100%;}","lightBoxImageSizeHack");
            }
        },

    showProgress : function()
        {
        var progress = document.getElementById("lightboxprogress");
        progress.style.display='';
        this._center(progress);
        },
    
    hideProgress: function()
        {
        var progress = document.getElementById("lightboxprogress");
        progress.style.display='none';
        },

    //this function lifted from Lightbox Gone Wild
    hideSelects: function(visibility)
        {
        var selects = document.getElementsByTagName('select');
        for(i = 0; i < selects.length; i++)
            {
            selects[i].style.visibility = visibility;
            }
        },

    showBg: function()
        {
        var overlay = document.getElementById('lightBoxOverlay');
        if (config.browser.isIE)
            {
            overlay.style.height = Math.max(document.documentElement.scrollHeight,document.documentElement.offsetHeight);
            overlay.style.width = document.documentElement.scrollWidth;
            }
        overlay.style.display = 'block';
        },

    showImage: function (url,text)
        {
        imgPreloader = new Image();
        imgPreloader.onload = function ()
            {
            var lb = document.getElementById("lightBoxContent");
            lb.innerHTML = "<img src="+url+">";
            lb.onclick = function(){TiddlyLightBox.hideBox();return false;};
            TiddlyLightBox.posBox(text);
            };
        imgPreloader.src = url;
        },
        
    showHtml : function(theID,text)
        {
        var lb = document.getElementById("lightBoxContent");
        if (theID.indexOf("tiddler:")==-1)
             lb.innerHTML = document.getElementById(theID).innerHTML;
        else
            { 
             wikify(store.getTiddlerText(theID.replace("tiddler:","")),lb);
             lb.className='tiddler';
            }
        lb.style.overflow = "auto";
        this.posBox(text);
        },

    posBox: function(text)
       {
       this.setTitle(text);
       this.hideProgress();
       var lb = document.getElementById("lightBox");
       lb.style.display = "";
       lb.style.visibilty = "hidden";
       lb.style.position = "absolute";
       this._center(lb);
       if(!TiddlyLightBox._curBox) return;
       lb.style.visibility = "visible";
       lb.style.display = "block";
       },

     setTitle: function(text)
        {
        document.getElementById("lightBoxTitle").innerHTML=  (text==undefined)? '': text;
        },

    _center: function(lb)
       {
       var lbSize = new TiddlyLightBox.getElementSize(lb);
       lb.style.left = (Math.round(findWindowWidth()/2) - (lbSize.width /2) + findScrollX())+'px';
       lb.style.top = (Math.round(findWindowHeight()/2) - (lbSize.height /2) + findScrollY())+'px';
       },

    //this function lifted from Ibox
    getElementSize : function(elem)
       {
       this.width = elem.offsetWidth || elem.style.pixelWidth;
       this.height = elem.offsetHeight || elem.style.pixelHeight;
       },

     hideBox: function()
         {
         if(!this._curBox)
             return;
         document.getElementById("tiddlyLightBoxWrapper").innerHTML= this.lightBoxHtml;
         setStylesheet("","lightBoxImageSizeHack");
         this._curBox = null;
         return false;
         }
}

TiddlyLightBox.createBoxWrapper();

Story.prototype.findContainingTiddler = function(e)
{
    while(e && (!hasClass(e,"tiddler") || !e.getAttribute("tiddler")))
        e = e.parentNode;
    return(e);
}

config.shadowTiddlers.TiddlyLightBoxStyles="/*{{{*/\n#lightBoxOverlay {\n position:absolute;\n top: 0;\n left: 0;\n width: 100%;\n height: 100%;\n z-index: 90; \n background-color: #000;\n -moz-opacity: 0.75;\n opacity: .75;\n filter: alpha(opacity=75);\n}\n#lightBoxOverlay[id]{ \n position: fixed;\n}\n\n#lightboxprogress { \n margin:0;padding:0;\n position: absolute;\n z-index:95;\n}\n\ndiv.lightBox {\n background: #fff;\n color: #fff;\n border: 4px solid #525252;\npadding:20px 20px 25px 20px; position:absolute; z-index:99;\n}\n\n#lightBoxClose {text-align:right; color:#000; font-size:1.0em; position:absolute; bottom:6px; right:20px;}\n#lightBoxClose a{color:#666; border-bottom:1px solid #666;cursor:pointer;}\n#lightBoxClose a:hover {color:#111; border-bottom:1px solid #666; cursor:pointer; background:transparent;}\n\n#lightBoxContent {border:1px solid #525252;color:#000; background:#fff;}\n#lightBox .tiddler {background:#fff;}\n\n#lightBoxContent img {border:0;margin:0;padding:0;display:block;cursor:pointer;}\n\n#lightBoxTitle {padding:0px; font-weight:bold; position:absolute; left:20px;bottom:6px; font-size:1.1em; color:#000;}\n\n/*}}}*/";
//}}}