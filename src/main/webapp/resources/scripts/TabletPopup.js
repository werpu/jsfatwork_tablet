dojo.provide("at.irian.TabletPopupView");
dojo.declare("at.irian.TabletPopupView", null, {

    id: null,
    node: null,
    origin: null,
    originContent: null,
    originHeader: null,
    originFooter: null,

    styleClass: 'tablet_menu',
    title:"Tablet Popup",
    content: "Default Content",
    footer: "Default Footer",

    template:"<div id='${id}' class='${styleClass}'><canvas class='heading_pointer'></canvas><div class='menu_content'><div class='content_header'>${title}</div><div class='content'>${content}</div><div class='content_footer' >${footer}</div></div>",

    constructor: function(args) {
        args = args || {};


        for (var key in args) {
            this [key] = args[key] || this[key];
        }
          dojo.addOnLoad(dojo.hitch(this, this.postInit));
    },

    postInit: function() {

        this.origin =  dojo.byId(this.origin) || document.querySelectorAll(this.origin)[0];

        this.originContent =  dojo.byId(this.originContent) || document.querySelectorAll(this.originContent)[0];
        this.originHeader =   dojo.byId(this.originHeader) || document.querySelectorAll(this.originHeader)[0];
        this.originFooter =   dojo.byId(this.originFooter) || document.querySelectorAll(this.originFooter)[0];


        this.id = this.id || this.origin.id;

        var placeHolder = document.createElement("div");
        placeHolder.innerHTML = this.template.replace(/\$\{id\}/g, this.id).replace(/\$\{styleClass\}/g, this.styleClass).replace(/\$\{title\}/g, this.title).replace(/\$\{content\}/g, this.content).replace(/\$\{footer\}/g, this.footer);
        //now we move our original node into our content part!
        this._moveContent(placeHolder.querySelectorAll(".content")[0], this.originContent);
        if (this.originHeader) {
            this._moveContent(placeHolder.querySelectorAll(".content_header")[0], this.originHeader);
        }
        if (this.originFooter) {
            this._moveContent(placeHolder.querySelectorAll(".content_footer")[0], this.originHeader);
        }

        this.node = placeHolder.childNodes[0];
        this.node.style.display = "none";

        this.origin.parentNode.replaceChild(this.node, this.origin);


    },


    _moveContent: function(target, origin) {
        target.innerHTML = origin.innerHTML;
    },

    show: function() {
        /*we work the opacity in the allow css transitional opacity fades*/
        this.node.style.opacity = "1";
        this.node.style.display = "";
    },

    hide: function() {
        this.node.style.opacity = "0";
        this.node.style.display = "none";
    },

    movePopup:function (posX, posY) {
        this.node.style.left = posX + "px";
        this.node.style.top = posY + "px";
    }



});

dojo.provide("at.irian.TabletPopup");
dojo.declare("at.irian.TabletPopup", null, {

    view: null,
    posX: 0,
    posY: 0,

    onclose: null,

    closeState: "none",

    constructor: function(args) {
        this.view = new at.irian.TabletPopupView(args);
        for (var key in args) {
            this [key] = args[key] || this[key];
        }

        dojo.addOnLoad(dojo.hitch(this, this.postInit));
    },

    postInit: function() {
        //we move it out of the way
        this.view.movePopup(-1000, 0);
    },



    show: function() {
        //TODO navigational control
        this.view.movePopup(this.posX, this.posY);
        this.view.show();

    },

    hide: function(closeState) {
        this.view.hide();

        //TODO trigger the move once the fade is done, via the fading event
        this.movePopup(-1000, 0);
        if (this.onclose) {
            this.closeState = closeState || "none";
            this.onclose(this);
        }
    }

});

