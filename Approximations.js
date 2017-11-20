// abstract
class Approximation {
	constructor(points) {
		if (new.target === Approximation)
			throw new TypeError("Approximation is an abstract class, do not instatiate it");

		if (!points || !Array.isArray(points) || points.length < 2)
			throw new Error("Error: approximation immpossible on given set");		
	}
}

class LinearApproximation extends Approximation {
	constructor(points) {
		super(points);
		var a, b;
		[a, b] = this._computeCoeffs(points);

		this.f = (x) => a*x + b;
		this.coeffs = [
			{name: "a", value: a},
			{name: "b", value: b}
		];
	}

	_computeCoeffs(points) {
		var n = points.length;
		var sxi = 0, sxi2 = 0, syi = 0, sxiyi = 0;

		points.forEach((p) => {
		    sxi += p.x;
		    sxi2 += p.x*p.x;
		    syi += p.y;
		    sxiyi += p.x*p.y;
		});

		var a = (n*sxiyi - sxi*syi)/(n*sxi2 - Math.pow(sxi, 2));
		var b = (syi - a*sxi)/n;

		return [a, b];
	}
}

class ParabolicApproximation extends Approximation {
	constructor(points) {
		super(points);
		var a, b, c;
		[a, b, c] = this._computeCoeffs(points);
		
		this.f = (x) => a*x*x + b*x + c;
		this.coeffs = [
			{name: "a", value: a},
			{name: "b", value: b},
			{name: "c", value: c}
		];
	}

	_computeCoeffs(points) {
		var n = points.length;
		var Sxi = 0, Sxi2 = 0, Sxi3 = 0, Sxi4 = 0,
			Sxi2yi = 0, Sxiyi = 0, Syi = 0;

		points.forEach((p) => {
		    Sxi += p.x;
		    Sxi2 += p.x*p.x;
		    Sxi3 += Math.pow(p.x, 3);
		    Sxi4 += Math.pow(p.x, 4);
		    Sxi2yi += p.x*p.x*p.y;
		    Sxiyi += p.x*p.y;
		    Syi += p.y;
		});

		var det = n*Sxi4*Sxi2 + 2*Sxi3*Sxi2*Sxi - Math.pow(Sxi2, 3) -
					n*Math.pow(Sxi3, 2) - Sxi4*Math.pow(Sxi, 2);
		var a = (n*Sxi2yi*Sxi2 + Sxi3*Sxi*Syi + Sxi2*Sxiyi*Sxi - 
					Math.pow(Sxi2, 2)*Syi - n*Sxi3*Sxiyi - Sxi2yi*Math.pow(Sxi, 2))/det,
			b = (n*Sxi4*Sxiyi + Sxi2*Sxi*Sxi2yi + Sxi3*Sxi2*Syi -
					Math.pow(Sxi2, 2)*Sxiyi - n*Sxi3*Sxi2yi - Sxi4*Sxi*Syi)/det,
			c = (Syi - b*Sxi - a*Sxi2)/n;

		return [a, b, c];
	}
}

class HyperbolicApproximation extends Approximation {
	constructor(points) {
		super(points);
		var a, b;
		[a, b] = this._computeCoeffs(points);

		this.f = (x) => a/x + b;
		this.coeffs = [
			{name: "a", value: a},
			{name: "b", value: b}
		];
	}

	_computeCoeffs(points) {
		var n = points.length;
		var Sinvxi = 0, Sinvxi2 = 0, Syi = 0, Sinvxiyi = 0;

		points.forEach((p) => {
		    Sinvxi += 1/p.x;
		    Sinvxi2 += Math.pow(1/p.x, 2);
		    Syi += p.y;
		    Sinvxiyi += 1/p.x*p.y;
		});

		var a = (n*Sinvxiyi - Sinvxi*Syi)/(n*Sinvxi2 - Math.pow(Sinvxi, 2));
		var b = (Syi - a*Sinvxi)/n;

		return [a, b];
	}
}

class LogarithmicApproximation extends Approximation {
	constructor(points) {
		super(points);
		var a, b;
		[a, b] = this._computeCoeffs(points);

		this.f = (x) => a*Math.log(x) + b;
		this.coeffs = [
			{name: "a", value: a},
			{name: "b", value: b}
		];
	}

	_computeCoeffs(points) {
		var n = points.length;
		var Slnxi = 0, Slnxi2 = 0, Syi = 0, Slnxiyi = 0;

		points.forEach((p) => {
		    Slnxi += Math.log(p.x);
		    Slnxi2 += Math.pow(Math.log(p.x), 2);
		    Syi += p.y;
		    Slnxiyi += Math.log(p.x)*p.y;
		});

		var a = (n*Slnxiyi - Slnxi*Syi)/(n*Slnxi2 - Math.pow(Slnxi, 2));
		var b = (Syi - a*Slnxi)/n;

		return [a, b];
	}
}

class ExponentialApproximation extends Approximation {
	constructor(points) {
		super(points);
		var a, b;
		[a, b] = this._computeCoeffs(points);

		this.f = (x) => b*Math.exp(a*x);
		this.coeffs = [
			{name: "a", value: a},
			{name: "b", value: b}
		];
	}

	_computeCoeffs(points) {
		var n = points.length;
		var Sxi = 0, Sxi2 = 0, Slnyi = 0, Sxilnyi = 0;

		points.forEach((p) => {
		    Sxi += p.x;
		    Sxi2 += p.x*p.x;
		    Slnyi += Math.log(p.y);
		    Sxilnyi += p.x*Math.log(p.y);
		});

		var a = (n*Sxilnyi - Sxi*Slnyi)/(n*Sxi2 - Math.pow(Sxi, 2));
		var b = Math.exp((Slnyi - a*Sxi)/n);

		return [a, b];
	}
}

function excludeWorstPoint(f, points) {
        var worstError = 0,
            worstPontIndex = 0;

        if (!f || typeof f !== 'function' || !points ||
            !Array.isArray(points) || points.length < 2)
            return;

        points.forEach((p, index) => {
            var fx = f(p.x);

            if (!fx || fx == Infinity)
                throw new Error("Error: incompatible function and point set");

            var error = Math.abs(fx - p.y);
            if (error > worstError) {
                worstError = error;
                worstPontIndex = index;
            }
        });

        var result = points.slice();
        result.splice(worstPontIndex, 1);
        return result;
    }