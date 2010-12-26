/**
 * set of canvas related shapes
 * which can be combined for vector like
 * elements.
 * The reason why we choose canvas here
 * is the easier programmatic style changes
 */
dojo.provide("at.irian.shapes.Triangle");

dojo.declare("at.irian.shapes.Triangle", null, {

    width: 50,
    height: 40,

    originX : 0,
    originY: 0,

    canvas: null,

    styleClass: "menu_triangle",

    constructor: function(args) {
        args = args || {};
        this.id = args.id || null;
        this.originX =  args.originX || 0;
        this.originY = args.originY || 0;
        this.canvas = args.canvas || null;

        this.width = args.width || 50;
        this.height = args.height || 40;

        this.styleClass = args.styleClass || "menu_triangle";

        dojo.addOnLoad(dojo.hitch(this, this.postInit));
    },

    postInit: function() {

        var canvas =(this.canvas)? this.canvas :  this.canvas = dojo.byId(this.id) || document.querySelectorAll(this.id)[0] || document.createElement("canvas");

        document.body.appendChild(canvas);
        if (!this.id) {
            dojo.addClass(canvas, this.styleClass);
            canvas.setAttribute("width", this.width);
            canvas.setAttribute("height", this.height);
        }

        var context = canvas.getContext('2d');
       // var gradient = context.createLinearGradient(this.width >> 1, 0, this.width >> 1, this.height - 1);
       // gradient.addColorStop(0, "rgb(188,55,142)");
       // gradient.addColorStop(1, "rgb(82,73,156)");

        context.shadowBlur = 5;
        context.shadowColor = "black";

        context.fillStyle = "blue";

        this.drawTriangle(0, 0, 3, context);

        //context.shadowBlur = 10;
        //context.shadowColor = "black";

// Stroke the outer outline

        context.lineWidth = 2;
        context.lineJoin = "round";
        context.strokeStyle = gradient;
        context.stroke();

// Turn off the shadow, or all future fills will have shadows
        //context.shadowColor = "transparent";

    },

    drawTriangle: function(x, y, offset, context) {


        //context.fillStyle = '#00f'; // blue
        context.strokeStyle = '#330066'; // dark purple
        context.lineWidth = 2;

        context.beginPath();
        context.moveTo((this.width - offset) >> 1, y);
        context.lineTo(this.originX, (this.height - offset) - 1);
        context.lineTo((this.width - offset) - 1, (this.height - offset) - 1);
        context.fill();
        context.closePath();
    }




});

new at.irian.shapes.Triangle();