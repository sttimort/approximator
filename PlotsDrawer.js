class PlotsDrawer {
    constructor(canvas) {
        this.canvas = canvas;
        this.canvas.drawer = this;
        this.ctx = canvas.getContext('2d');

        this.onclickSize = 1;
        this.onclickFillStyle = 'black';
        
        this.majorTicStepX = 1; // in units
        this.minorTicsPerMajorX = 3;
        this.majorTicStepY = 1; // in units
        this.minorTicsPerMajorY = 3;
        
        
        this.lowXpx = 0;
        this.highXpx = canvas.width-1;
        this.lowYpx = 0;
        this.highYpx = canvas.height-1;

        this.lowX = -10;
        this.highX = 10;
        this.lowY = -10;
        this.highY = 10;
        
        this.dirX = 1;
        this.dirY = -1;

        this.plots = [];
        this.points = [];
        
        this.setFrameLimits(this.lowX, this.highX, this.lowY, this.highY);
    }
    
    setFrameLimits(leftX, rightX, bottomY, topY, saveTicStep=true) {
        this._restoreInitCtx();

        var newFrameWidth = Math.abs(rightX - leftX);
        var newFrameHeight = Math.abs(topY - bottomY);
        if (!saveTicStep) {
            this.majorTicStepX = this.majorTicStepX/(this.highX-this.lowX)*newFrameWidth;
            this.majorTicStepY = this.majorTicStepY/(this.highY-this.lowY)*newFrameHeight;
        }
        
        this.scaleX = newFrameWidth/this.canvas.width;
        this.scaleY = newFrameHeight/this.canvas.height;

        var newDirX = Math.sign(rightX - leftX);
        var newDirY = Math.sign(topY - bottomY);

        this.ctx.scale(this.dirX*newDirX, this.dirY*newDirY);
        this.dirX = newDirX;
        this.dirY = newDirY;

        this.ctx.translate(-leftX/this.scaleX, -topY/this.scaleY);

        if (leftX < rightX) {
            this.lowX = leftX;
            this.highX = rightX;
            this.lowXpx = leftX/this.scaleX;
            this.highXpx = rightX/this.scaleX;
        } else {
            this.lowX = rightX;
            this.highX = leftX;
            this.lowXpx = rightX/this.scaleX;
            this.highXpx = leftX/this.scaleX;
        }

        if (bottomY < topY) {
            this.lowY = bottomY;
            this.highY = topY;
            this.lowYpx = bottomY/this.scaleY;
            this.highYpx = topY/this.scaleY;
        } else {
            this.lowY = topY;
            this.highY = bottomY;
            this.lowYpx = topY/this.scaleY;
            this.highYpx = bottomY/this.scaleY;
        }

        this.rightX = rightX;
        this.leftX = leftX;
        this.bottomY = bottomY;
        this.topY = topY;
    }

    drawPlot(f, strokeStyle, shouldSave=true) {
        this.ctx.save();

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.beginPath();

        var prevPointExist = false;
        var y = f(this.lowXpx*this.scaleX);
        if ((y || y == 0) && y != Infinity) {
            this.ctx.moveTo(this.lowXpx, y/this.scaleY);
            prevPointExist = true;
        }

        for (var xu = Math.round(this.lowXpx); xu <= this.highXpx; xu++) {
            y = f(xu*this.scaleX);
            if (!y && y != 0 || y == Infinity)
                prevPointExist = false;
            else if (!prevPointExist) {
                this.ctx.moveTo(xu, y/this.scaleY);
                prevPointExist = true;
            }
            else {
                this.ctx.lineTo(xu, y/this.scaleY);
                prevPointExist = true;
            }
        }
        this.ctx.stroke();

        this.ctx.restore();

        if (shouldSave)
            this.plots.push({
                f: f,
                strokeStyle: strokeStyle
            });
    }

    drawPoint(x, y, fillStyle, size=1, shouldFit=false, shouldSave=true) {
        if (shouldFit && this._setFrameLimitsToFitPoint(x, y))
            this.redraw();

        var xpx = x/this.scaleX;
        var ypx = y/this.scaleY;

        if (xpx < this.lowXpx || xpx > this.highXpx ||
            ypx < this.lowYpx || ypx > this.highYpx)
            return;

        this.ctx.save();

        this.ctx.fillStyle = fillStyle;
        this.ctx.beginPath();

        var r = size*3;
        r = !r || r == 0 ? 3 : r;
        this.ctx.arc(xpx, ypx, r, 0, 2*Math.PI);
        this.ctx.fill();

        this.ctx.restore();

        if (shouldSave)
            this.points.push({
                x: x,
                y: y,
                fillStyle: fillStyle,
                size: size
            });
    }

    startDrawPointsOnClick(callback) {
        this.onclickCallback = callback;
        this.canvas.onclick = this._onclickDrawPoint;
    }

    draw() {
        this.drawEmpty();
        if (this.plots.forEach)
            this.plots.forEach((plot) => 
                this.drawPlot(plot.f, plot.strokeStyle)
            );

        if (this.points.forEach)
            this.points.forEach((point) => 
                this.drawPoint(point.x, point.y, point.fillStyle, point.size, false, false)
            );
    }

    drawEmpty() {
        this._drawXAxis();
        this._drawYAxis();
        this._drawGrid();
    }

    redraw() {
        this.clear();
        this.draw();
    }

    removeAllPlots() {
        if (this.plots.length > 0) {
            this.plots.splice(0, this.plots.length);
            this.redraw();
        }
    }

    clear() {
        this.ctx.save();
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    
    // privates
    _restoreInitCtx() {
        this.ctx.resetTransform();
        this.dirX = 1;
        this.dirY = -1;
    }
    
    _drawXAxis() {
        this.ctx.lineWidth = 2;
        this._drawLine(this.lowXpx, 0, this.highXpx, 0);
        this._drawXArrow(this.highXpx, 0, 10, 5);
    }
    
    _drawYAxis() {
        this.ctx.lineWidth = 2;
        this._drawLine(0, this.lowYpx, 0, this.highYpx);
        this._drawYArrow(0, this.highYpx, 10, 5);
    }
    
    _drawGrid() {
        if (this.majorTicStepX == undefined)
            throw new Error("majorTicStepX in undefined");
        
        if (this.majorTicStepY == undefined)
            throw new Error("majorTicStepY in undefined");
        
        if (this.minorTicsPerMajorX == undefined)
            throw new Error("minorTicsPerMajorX in undefined");
        
        if (this.minorTicsPerMajorY == undefined)
            throw new Error("minorTicsPerMajorY in undefined");
        
        this.ctx.save();
        this._drawXGrid();
        this._drawYGrid();
        this.ctx.restore();
    }
    
    _drawXGrid() {
        this.ctx.lineWidth = 0.7;
        this.ctx.strokeStyle = "#707070";

        var boundary = Math.max(Math.abs(this.highXpx*this.scaleX),
                                Math.abs(this.lowXpx*this.scaleX));
        
        var counter = 1;
        var step = Math.abs(this.majorTicStepX)/(Math.abs(this.minorTicsPerMajorX)+1);
        if (step != 0) 
            for (let x = step; x < boundary; x += step) {
                let isMajor = counter % (Math.abs(this.minorTicsPerMajorX)+1) == 0;
            
                this.ctx.globalAlpha = isMajor ? 0.7 : 0.3;
                let xpx = x/this.scaleX;
                this._drawLine(xpx, this.lowYpx, xpx, this.highYpx);
                this._putTicX(xpx, isMajor, isMajor ? x : undefined);
                this._drawLine(-xpx, this.lowYpx, -xpx, this.highYpx);
                this._putTicX(-xpx, isMajor, isMajor ? x : undefined);            
                counter++;
            }
    }
    
    _drawYGrid() {
        this.ctx.lineWidth = 0.;
        this.ctx.strokeStyle = "#707070";
        var boundary = Math.max(Math.abs(this.highYpx*this.scaleY),
                                Math.abs(this.lowYpx*this.scaleY));
    
        var counter = 1;
        var step = Math.abs(this.majorTicStepY)/(Math.abs(this.minorTicsPerMajorY)+1);
        if (step !=0)
            for (let y = step; y < boundary; y += step) {
                let isMajor = counter % (Math.abs(this.minorTicsPerMajorY)+1) == 0;
            
                this.ctx.globalAlpha = isMajor ? 1 : 0.5;            
                let ypx = y/this.scaleY;
                this._drawLine(this.lowXpx, ypx, this.highXpx, ypx);
                this._putTicY(ypx, isMajor, isMajor);
                this._drawLine(this.lowXpx, -ypx, this.highXpx, -ypx);
                this._putTicY(-ypx, isMajor, isMajor ? y : undefined);            
                counter++;
            }
    }
    
    _putTicX(x, isMajor, shouldDrawNumber) {
        this.ctx.save();
        
        var halfHeight = isMajor ? 5 : 3;
        this.ctx.globalAlpha = 1;        
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = "black";
        this.ctx.lineCap = "round";
        this._drawLine(x, halfHeight, x, -halfHeight);
        
        if (shouldDrawNumber) {
            this.ctx.scale(this.dirX == 1 ? 1 : -1, this.dirY == -1 ? 1 : -1);
            this.ctx.fillText(x*this.scaleX, x-4, 15);
        }

        
        this.ctx.restore();
    }
    
    _putTicY(y, isMajor, shouldDrawNumber) {
        this.ctx.save();

        var halfWidth = isMajor ? 5 : 3;
        this.ctx.globalAlpha = 1;
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = "black";
        this.ctx.lineCap = "round";
        this._drawLine(halfWidth, y, -halfWidth, y);
        
        if (shouldDrawNumber) {
            this.ctx.scale(this.dirX == 1 ? 1 : -1, this.dirY == -1 ? 1 : -1);
            this.ctx.fillText(y*this.scaleY, 7, -y + 4);
        }
        
        this.ctx.restore();
    }

    _setFrameLimitsToFitPoint(x, y) {
        if (this._doesPointFit(x, y))
            return false;

        let marginX = (this.highX - this.lowX)/20,
            marginY = (this.highY - this.lowY)/20;

        let newLowX = this.lowX,
            newHighX = this.highX,
            newLowY = this.lowY,
            newHighY = this.highX;

        if (x < this.lowX + marginX)
            newLowX = x - marginX;
        else if (x > this.highX - marginX)
            newHighX = x + marginX;

        if (y < this.lowXY + marginY)
            newLowY = y - marginY;
        else if (y > this.highY - marginY)
            newHighY = y + marginY;

        this.setFrameLimits(newLowX, newHighX, newLowY, newHighY, false);
        return true;
    }

    _doesPointFit(x, y) {
        let marginX = (this.highX - this.lowX)/20,
            marginY = (this.highY - this.lowY)/20;

        if (x < this.lowX + marginX || x > this.highX - marginX ||
            y < this.lowY + marginY || y > this.highY - marginY)
            return false;
        return true;
    }
    
    
    _drawXArrow(x, y, length, fattness) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x-length, y+fattness);
        this.ctx.lineTo(x-length, y-fattness);
        this.ctx.fill();
    }

    _drawYArrow(x, y, length, fattness) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x-fattness, y-length);
        this.ctx.lineTo(x+fattness, y-length);
        this.ctx.fill();
    }

    _drawLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    _onclickDrawPoint(event) {
        var leftXpx = this.drawer.dirX == 1 ? this.drawer.lowXpx : this.drawer.highXpx;
        var topYpx = this.drawer.dirY == -1 ? this.drawer.lowYpx : this.drawer.highYpx;

        var pointXpx = leftXpx + this.drawer.dirX*event.offsetX;
        var pointYpx = topYpx - this.drawer.dirX*event.offsetY;

        var pointX = pointXpx*this.drawer.scaleX;
        var pointY = pointYpx*this.drawer.scaleY;

        this.drawer.drawPoint(pointX, pointY, this.drawer.onclickFillStyle, this.drawer.onclickSize);

        if (this.drawer.onclickCallback && typeof this.drawer.onclickCallback === 'function')
            this.drawer.onclickCallback(pointX, pointY);
    }
}