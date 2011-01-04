function ipadInit() {

    var scrollContent;
    var scrollSide;

    function loaded() {
        scrollContent = new iScroll('contentScroller');
        scrollSide = new iScroll('navScroller');
    }

    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, false);
    document.addEventListener('DOMContentLoaded', loaded, false);
}

ipadInit();

dojo.provide("at.irian.NavigationModel");
dojo.declare("at.irian.NavigationModel", null, {

    url: null,
    model: null,
    currentPosition: null,

    positionStack: [],



    constructor: function() {
    },

    setModel: function(model) {
        this.model = model;
        if (!model) {
            this.currentPosition = null;
            return;
        }
        this.currentPosition = this.model.items;

    },

    isFirst: function() {
        return this.currentPosition == this.model.items;
    },

    /*gets the item from the ref at the current tree position*/
    getItemFromRef: function(ref) {
        for (var cnt = 0; cnt < this.currentPosition.length; cnt++) {
            var child = this.currentPosition[cnt];
            if (child.ref == ref) {
                return child
            }
        }
        return null;
    },

    goDown: function(ref) {
        var child = this.getItemFromRef(ref);
        if (child && child.children) {
            this.positionStack.unshift(this.currentPosition);
            this.currentPosition = child.children;
        }
    },


    goUp: function() {
        if (!this.positionStack.length) {
            return;
        }
        this.currentPosition = this.positionStack[0];
        this.positionStack.shift();
    }

});

dojo.provide("at.irian.NavigationView");
dojo.declare("at.irian.NavigationView", null, {
    controller: null,

    template_singleEntry: "<li><a href= '#' onclick='fadeController.selectItem(\"${item.ref}\"); return false;' >${item.label}</a></li>",
    template_subentries: "<li><a href= '#' onclick='fadeController.selectItem(\"${item.ref}\"); return false;' >${item.label}</a><a href='#' >&nbsp;&gt;&gt;</a></li> ",

    constructor: function(controller) {
        this.controller = controller;
    },


    /*builds the inner view from the given model*/
    buildView: function() {
        var sentries = this.controller.model.currentPosition;

        var resultString = [];
        resultString.push("<ul class=\"navScroller\">");
        for (var cnt = 0; cnt < sentries.length; cnt++) {
            var entry = sentries[cnt];
            var template = (entry.children) ? this.template_subentries : this.template_singleEntry;
            console.debug(entry.ref);
            console.debug(template.replace(/\$\{item\.ref\}/g, entry.ref));

            var result = template.replace(/\$\{item\.ref\}/g, entry.ref).replace(/\$\{item\.label\}/g, entry.label);
            //TODO enable onclick fetch next hook
            resultString.push(result);
        }
        resultString.push("</ul>");
        return resultString.join("");
    },

    renderView: function(elem) {
        var elem = document.getElementById(elem) || document.querySelectorAll("." + elem)[0];
        elem.innerHTML = this.buildView();
    },

    /**
     * ipad fadout left animation for our submenus
     *
     * @param elem
     */
    fadeoutLeft: function(elem) {
        var _t = this;

        var transitionStart = function() {
            document.querySelectorAll(".button_back")[0].style.opacity = _t.controller.model.isFirst() ? 0 : 1;

            dojo.removeClass(elem, "transition_content")
            dojo.addClass(elem, "transition_go");
            //elem.style.webkitTransform = "translate(-500px)";
            elem.style.marginLeft = "-500px";
            elem.style.opacity = 0;
        }

        var transitionEnd = function() {

            elem.removeEventListener("webkitTransitionEnd", transitionEnd);
            elem.innerHTML = _t.buildView();
            dojo.removeClass(elem, "transition_go");
            dojo.addClass(elem, "transition_content");
            elem.style.marginLeft = "0px";
            elem.style.left = 0;
            elem.style.opacity = 1;

        };

        elem = document.getElementById(elem) || document.querySelectorAll("." + elem)[0];
        elem.addEventListener("webkitTransitionEnd", transitionEnd);
        transitionStart();
    },

    /**
     * the content area can be filled as is
     * Next step we have to define a fadeInRight
     */

    fadeinRight: function(elem) {
        var _t = this;
        var transitionStart = function() {
            document.querySelectorAll(".button_back")[0].style.opacity = _t.controller.model.isFirst() ? 0 : 1;

            dojo.removeClass(elem, "transition_content")
            dojo.addClass(elem, "transition_go");
            elem.style.marginLeft = "500px";
            elem.style.opacity = 0;
        }
        var transitionEnd = function() {
            elem.removeEventListener("webkitTransitionEnd", transitionEnd);
            elem.innerHTML = _t.buildView();
            dojo.removeClass(elem, "transition_go");
            dojo.addClass(elem, "transition_content");
            elem.style.marginLeft = "0px";
            elem.style.left = 0;
            elem.style.opacity = 1;

        };

        elem = document.getElementById(elem) || document.querySelectorAll("." + elem)[0];
        elem.addEventListener("webkitTransitionEnd", transitionEnd);

        transitionStart();

    }
});

dojo.provide("at.irian.FadeController");
dojo.declare("at.irian.FadeController", null, {

    model: null,
    view: null,
    url: null,
    elem: null,

    constructor: function(elem, url) {
        this.model = new at.irian.NavigationModel();
        this.view = new at.irian.NavigationView(this);
        this.url = url;
        this.elem = elem;

        dojo.addOnLoad(dojo.hitch(this, this.loadModel));
        dojo.addOnLoad(dojo.hitch(this, this.pageInit));
    },

    fadeoutLeft: function(ref) {
        this.view.fadeoutLeft(this.elem);
    },

    fadeinRight: function() {
        this.view.fadeinRight(this.elem);

    },

    loadModel: function() {
        dojo.xhrGet({
            url: this.url,
            handleAs: "text",
            load: dojo.hitch(this, this._loadData),
            error: this._error
        });
    },

    pageInit: function() {
        var _t = this;
        var ret = document.querySelectorAll(".button_back")[0];
        ret.onclick = function() {
            _t.model.goUp();
            _t.view.fadeinRight(_t.elem);
            return false;
        };

    },

    _loadData: function(responseArg) {
        /*initial load*/
        var toProcess = "var theVal = " + responseArg + ";";
        eval(toProcess);

        this.model.setModel(theVal);
        this.view.renderView(this.elem);
    }
    ,
    _error: function(error) {
        alert("An unexpected error occurred: " + error);
    },

    /**
     * the item selector should do two things
     * <li>loading the data, and triggering the next level if there is one process</li>
     */
    selectItem: function(identifier) {

        this.model.goDown(identifier);
        this.view.fadeoutLeft(this.elem);
        //TODO add view change handling here
    }

});

var fadeController = new at.irian.FadeController("nav", "http://localhost:8080/ipadscratchpad/pages/bookindex.json");