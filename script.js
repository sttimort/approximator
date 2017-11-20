const PATTERN = "(-|\\+)?[0-9]+(\\.[0-9]+)?((e|E)(-|\\+)?[0-9]+)?";

var approximations = {
    linear: LinearApproximation,
    parabolic: ParabolicApproximation,
    hyperbolic: HyperbolicApproximation,
    logarithmic: LogarithmicApproximation,
    exponential: ExponentialApproximation
};


window.onload = function() {
    var canvas = document.getElementById("mycanvas");

    var currentApprox = approximations.linear;
    var points = [{x: 1, y: 5.3}, {x: 2, y: 6.3}, {x: 3, y: 4.8}, {x: 4, y: 3.8}, {x: 5, y: 3.3}];
    // var points = [{x: -2, y: -4.5}, {x: -1, y: -0.8}, {x: 0, y: 0.2}, {x: 1, y: -1.23}, {x: 2, y: -3.83}];
    var drawer;
    if (canvas.getContext) {
        drawer = new PlotsDrawer(canvas);

        drawer.setFrameLimits(-10, 10, -10, 10);
        drawer.majorTicStepX = 2;
        drawer.majorTicStepY = 2;
        drawer.minorTicsPerMajorX = 3;
        drawer.minorTicsPerMajorY = 3;

        drawer.startDrawPointsOnClick((x, y) => {
            if (!points.find((p) => p.x == this.x && p.y == this.y))
                points.push({x: x, y: y});
        });
        drawer.points = points.slice();
        drawer.draw();
    }

    document.getElementById("rm-all-points").onclick = function() {
        points.splice(0, points.length);
        drawer.points = points.slice();
        drawer.redraw();
    };

    

    document.getElementById("rm-plots").onclick = function() {
        drawer.removeAllPlots();
    }

    var newPointForm = new Vue({
        el: "#new-point-form",
        data: {
            x: 0,
            y: 0,
            numPattern: PATTERN
        },
        methods: {
            addNewPoint: function() {
                if (!points.find((p) => p.x == this.x && p.y == this.y))
                    points.push({x: parseFloat(this.x), y: parseFloat(this.y)});
                    drawer.drawPoint(parseFloat(this.x), parseFloat(this.y), "black", 1, true);
            }
        }
    });

    var approxSelector = new Vue({
        el: "#approx-selector",
        data: {
            currentApprox: "linear"
        }
    });
    approxSelector.$watch("currentApprox", (newApprox) => {
        currentApprox = approximations[newApprox];
    })

    var pointsVue = new Vue({
        el: "#points-container",
        data: {
            points: points
        },
        methods: {
            removePoint: function(x, y) {
                var index = points.findIndex((p) => p.x == x && p.y == y);
                if (index != -1) {
                    points.splice(index, 1);
                    drawer.points = points.slice();
                    drawer.redraw();
                }
            }
        }
    });

    var coeffsBeforeVue = new Vue({
        el: "#coeffs-before",
        data: {
            coeffs: []
        },
        computed: {
            seen: function() {
                return this.coeffs.length > 0;
            }
        }
    });

    var coeffsAfterVue = new Vue({
        el: "#coeffs-after",
        data: {
            coeffs: []
        },
        computed: {
            seen: function() {
                return this.coeffs.length > 0;
            }
        }
    });

    var approxBtn = new Vue({
        el: "#approximate",
        data: {
            points: points
        },
        computed: {
            disabled: function() {
                return this.points.length < 3;
            }
        },
        methods: {
            approximate: function() {
                drawer.removeAllPlots();
                var approx = new currentApprox(points);
                drawer.drawPlot(approx.f, "red");
                coeffsBeforeVue.coeffs = approx.coeffs;
                approx = new currentApprox(excludeWorstPoint(approx.f, points));
                drawer.drawPlot(approx.f, "green");
                coeffsAfterVue.coeffs = approx.coeffs;
            }
        }
    });

    var frameLimitsForm = new Vue({
        el: "#frame-limits-form",
        data: {
            left: drawer.leftX ,
            right: drawer.rightX ,
            bottom: drawer.bottomY ,
            top: drawer.topY,
            numPattern: PATTERN
        },
        methods: {
            update: function() {
                var left = parseFloat(this.left),
                    right = parseFloat(this.right),
                    bottom = parseFloat(this.bottom),
                    top = parseFloat(this.top);

                drawer.setFrameLimits(left, right, bottom, top, false);
                drawer.redraw();
            }
        }
    });

    // document.getElementById("approximate").onclick = function() {
    //     console.log("hello");
        
    // };
}