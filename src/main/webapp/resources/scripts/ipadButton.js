/*
 * specialzed ipad button controller
 * the button itself is not a normal button anymore
 * but a styled div and the view part is the css
 * according to the button type given
 */

dojo.provide("at.irian.ipadButton", null, {

    holder: null,
    replacement: null,
    styleClass: null,
    template: "<div if='${identifier}' class='${styleClass}'>$label</div>",
    buttonType: "", /*button types, null, direction_left, direction_right, menu_button*/
    target_menu: null,
    label: null,
    id: null,

    constructor: function(args) {
        this.holder = args.source;
        this.id = this.holder.id;
        if (!this.id) {
            at.irian.ipadButton._autoID = at.irian.ipadButton._autoID || 0;
            at.irian.ipadButton._autoID++;
            this.id = "tablet_id" + at.irian.ipadButton._autoID;
        }
        this.buttonType = args.buttonType || "normal";

        var styleClass = [];
        styleClass.push(args.styleClass || "");
        styleClass.push(this.holder.className || "");

        switch (this.buttonType) {
            case "normal":
                styleClass.push("tablet_bt_normal");
                break;
            case "direction_left":
                styleClass.push("tablet_bt_left");
                break;
            case "direction_right":
                styleClass.push("tablet_bt_right");
                break;
            case "menu_button":
                styleClass.push("tablet_bt_menu");
                break;

        }
        this.styleClass = styleClass.join(" ");
        this.label = args.label || "Default"
        this.template = args.template || this.template;
        this.onclick = args.onclick || this.onclick;

        dojo.addOnLoad(dojo.hitch(this, this.postInit));
    },

    prepareDom: function() {
        var domStr = this.template.replace(/\$\{identifier\}/g, this.identifier)
                .replace(/\$\{styleclass\}/g, this.styleClass)
                .replace(/\$\{label\}/g, this.label);
        var placeHolder = document.createElement("div");
        placeHolder.innerHTML = domStr;

        //we replace our element with the newly generated one
        this.holder = dojo.byId(this.holder);
        this.replacement = placeHolder.childNodes[0];
        this.holder.parentNode.replaceChild(this.replacement, this.holder);
        this.holder.parentNode = null;

        //we now add our onclick handler to the holder
        this.replacement.addEventListener("onclick", dojo.hitch(this, this.onclick));
    },

    postInit: function() {
        this.prepareDom();
    },

    /*empty onclick handler*/
    onclick: function(event) {

    }

})


