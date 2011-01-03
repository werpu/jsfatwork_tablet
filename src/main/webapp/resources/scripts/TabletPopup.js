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

    closer: true,
    bubble: true,


    bubbleOffset : 12,

    //TODO modal handling

    template:"<div id='${id}' class='${styleClass}'><div id='${id}_bubble' class='dlg_bubble'></div><div id='${id}_closer' class='dlg_closer'><img  src='../resources/images/dlg_close.png' width='35' height='35' ></img></div><div class='menu_content'><div class='content_header'>${title}</div><div class='content'>${content}</div><div class='content_footer' >${footer}</div></div>",

    constructor: function(args) {
        args = args || {};

        for (var key in args) {
            this [key] = args[key] || this[key];
        }
        dojo.addOnLoad(dojo.hitch(this, this.postInit));
    },

    postInit: function() {

        this.origin = dojo.byId(this.origin) || document.querySelectorAll(this.origin)[0];
        this.originHTML = this.origin.innerHTML;

        this.originContent = dojo.byId(this.originContent) || document.querySelectorAll(this.originContent)[0];
        this.originHeader = dojo.byId(this.originHeader) || document.querySelectorAll(this.originHeader)[0];
        this.originFooter = dojo.byId(this.originFooter) || document.querySelectorAll(this.originFooter)[0];

        this.id = this.id || this.origin.id;

        this.prepareDom();

        if (this.closerNode) {
            this._closerCloseHandler = dojo.connect(this.closerNode, "onclick", this, this.hide);
        }
    },


    _moveContent: function(target, origin) {
        target.innerHTML = origin.innerHTML;
    },


    /**
     * does all the needed dom operations which can be used as callbacks
     */
    prepareDom: function() {
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

        this.closerNode = this.node.querySelectorAll(".dlg_closer")[0];
        this.bubbleNode = this.node.querySelectorAll(".dlg_bubble")[0];

        if (this.closerNode) {
            this.closerNode.parentNode.removeChild(this.closerNode);
            document.body.appendChild(this.closerNode);

        }
        if (this.bubbleNode) {
            this.bubbleNode.parentNode.removeChild(this.bubbleNode);
            document.body.appendChild(this.bubbleNode);
        }
    },

    restoreDom: function() {

        //todo check if a relative placement is feasable
        if (this.closerNode) {
            this.closerNode.parentNode.removeChild(this.closerNode);
            this.node.appendChild(this.closerNode);

        }
        if (this.bubbleNode) {
            this.bubbleNode.parentNode.removeChild(this.bubbleNode);
            this.node.appendChild(this.bubbleNode);
        }

        this.node.parentNode.replaceChild(this.origin, this.node);
        this.origin.innerHTML = this.originHTML;
        if (this._closerCloseHandler) {
            dojo.disconnect(this._closerCloseHandler);
        }
    },

    show: function() {
        /*we work the opacity in the allow css transitional opacity fades*/
        this.node.style.opacity = "1";
        this.node.style.display = "block";

        if (this.closer && this.closerNode) {
            this.closerNode.style.opacity = "1";
            this.closerNode.style.display = "";
        }

        if (this.bubble && this.bubbleNode) {
            this.bubbleNode.style.opacity = "1";
            this.bubbleNode.style.display = "";
        }

        this._globalOnClick_ = dojo.connect(window, "onclick", this, this.hide);
        this._localOnClick_ = dojo.connect(this.node, "onclick", this, this.stopOnClick);
    },

    stopOnClick: function(ev) {

        ev.stopPropagation();
    },

    hide: function() {
        dojo.disconnect(this._localOnClick_);
        dojo.disconnect(this._globalOnClick_);
        this.node.style.opacity = "0";
        if (this.closer && this.closerNode) {
            this.closerNode.style.opacity = "0";
        }

        if (this.bubble && this.bubbleNode) {
            this.bubbleNode.style.opacity = "0";
        }

        this._transitionEnd_ = this._transitionEnd_ || dojo.hitch(this, this.hideEnd);
        this.node.addEventListener("webkitTransitionEnd", this._transitionEnd_);
    },

    hideEnd: function() {
        this.node.removeEventListener("webkitTransitionEnd", this._transitionEnd_);
        this.node.style.display = "none";
        if (this.closer && this.closerNode) {
            this.closerNode.style.display = "none";
        }
        if (this.bubble && this.bubbleNode) {
            this.bubbleNode.style.display = "none";
        }
    },

    movePopup:function (posX, posY) {
        this.node.style.left = posX + "px";
        this.node.style.top = posY + "px";

        if (this.closer && this.closerNode) {
            this.closerNode.style.left = (posX - 18) + "px";
            this.closerNode.style.top = (posY - 18) + "px";
        }

        if (this.bubble && this.bubbleNode) {
            this.bubbleNode.style.left = (posX + this.bubbleOffset) + "px";
            this.bubbleNode.style.top = (posY - 30) + "px";

        }

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
    },
    /*callback interception point in case someone wants to replace the entire dialog with an ajax update*/
    beforeAjaxUpdate: function() {
        this.view.restoreDom();
    }

});

