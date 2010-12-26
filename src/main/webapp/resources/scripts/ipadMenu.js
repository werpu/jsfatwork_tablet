dojo.provide("at.irian.IpadMenu");
dojo.declare("at.irina.IpadMenu", null, {

    node: null,
    origin: null,

    template:"<div id='${id}' class='tablet_menu'><canvas class='heading_pointer'/><div class='menu_content'><div class='content_header' /><div class='content'/><div class='content_footer' /></div>",

    constructor: function() {

        dojo.addOnLoad(dojo.hitch(this, this.postInit));
    },

    postInit: function() {

    }


});


