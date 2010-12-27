dojo.provide("at.irian.TabletPopupView");
dojo.declare("at.irina.TabletPopupView", null, {

    id: null,
    node: null,
    origin: null,
    origin_header: null,
    origin_footer: null,
    query: null,
    styleClass: 'tablet_menu',



    template:"<div id='${id}' class='${styleClass}'><canvas class='heading_pointer'/><div class='menu_content'><div class='content_header'>${title}</div><div class='content'/><div class='content_footer' /></div>",

    constructor: function(args) {
        args = args || {};

        dojo.addOnLoad(dojo.hitch(this, this.postInit));
        for (var key in args) {
            this [key] = args[key] || this[key];
        }
        dojo.addOnLoad(dojo.hitch(this, this.postInit()));
    },

    postInit: function() {
        this.origin = this.origin || dojo.byId(this.id) || document.querySelectoryAll(this.query);

        this.id = this.id || this.origin.id;

        var placeHolder = document.createElement("div");
        placeHolder.innerHTML = this.template.replace(/\$\{id\}/g, this.id).replace(/\$\{id\}/g, this.styleClass);
        //now we move our original node into our content part!
        this._moveContent(placeHolder.querySelectorAll(".content")[0], this.origin);
        if (this.originHeader) {
            this._moveContent(placeHolder.querySelectorAll(".content_header")[0], this.originHeader);
        }
        if (this.originFooter) {
            this._moveContent(placeHolder.querySelectorAll(".content_footer")[0], this.originHeader);
        }

        this.node = placeHolder.childNodes[0];
        this.node.style.display = "none";

        this.origin.parentNode.replaceChild(placeHolder.childNodes[0], this.origin);

    },


    _moveContent: function(target, origin) {
        target.innerHTML = origin.innerHTML;
    },

    show: function() {
        /*we work the opacity in the allow css transitional opacity fades*/
        this.view.node.style.opacity = "1";
        this.view.node.style.display = "";
    },

    hide: function() {
        this.view.node.style.opacity = "0";
        this.view.node.style.display = "none";
    },

    movePopup:function (posX, posY) {
        this.view.node.style.left = posX + "px";
        this.view.node.style.top = posY + "px";
    }



});

dojo.provide("at.irian.TabletPopup");
dojo.declare("at.irina.TabletPopup", null, {

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

        dojo.addOnLoad(dojo.hitch(this, this.postInit()));
    },

    postInit: function() {
        this.view.postInit();
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