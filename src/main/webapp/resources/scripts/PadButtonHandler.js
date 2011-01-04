/**
 * Simple controller for already styled image buttons
 * id adds a styleclass down to the element
 * if pressed
 **/

dojo.provide("at.irian.PadButtonHandler");
dojo.declare("at.irian.PadButtonHandler", null, {
    onclick: null,
    id: null,
    origin: null,
    node: null,

    constructor: function(args) {
        args = args || {};

        for (var key in args) {
            this [key] = args[key] || this[key];
        }
        dojo.addOnLoad(dojo.hitch(this, this.postInit));

    },

    postInit: function() {
        this.node = dojo.byId(this.origin) || document.querySelectorAll(this.origin)[0];
        this.id = this.node.id;
        this._onmousedown_ = dojo.connect(this.node, "onmousedown", this, this.onmousedown);
        if(this.onclick) {
            this._onclick_ = dojo.connect(this.node, "onclick", this, this.onclick);
        }
    },



    onmousedown: function(evt) {
        evt.stopPropagation();
        this._onmouseup_ = dojo.connect(window, "onmouseup", this, this.onmouseup);
        dojo.addClass(this.node, "down");
    },

    onmouseup: function(evt) {
        dojo.disconnect(this._onmouseup_);
        dojo.removeClass(this.node, "down");
        delete this._onmouseup_;
    }
})
