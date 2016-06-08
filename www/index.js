'use strict';

var Plotly = require('plotly.js');
var gaussianMixtureEM = require('../');
var pack = require('ndarray-pack');
var unpack = require('ndarray-unpack');
var pool = require('ndarray-scratch');
var show = require('ndarray-show');
var initializeModel = require('../src/initialize-model');

window.Plotly = Plotly;

var plot = {
  iterating: false,
  N: 1000,
  K: 5,
  M: 2,
  x: [],
  y: [],
  xrange: [0, 10],
  yrange: [0, ((window.innerHeight - 75 - 30) / (window.innerWidth - 30 - 30)) * 10],
  status: {},
  tolerance: 1e-6,
  iterationCounter: 0,

  computePDF: function () {
    var t1 = Date.now();
    var i, j, k, tx, ty;
    var nx = 50;
    var ny = 50;

    this.xval = [];
    this.yval = [];

    // Compute x
    for (var i = 0; i < nx; i++) {
      var tx = i / (nx - 1);
      this.xval[i] = this.xrange[0] + (this.xrange[1] - this.xrange[0]) * tx;
    }
    for (var j = 0; j < ny; j++) {
      var ty = j / (ny - 1);
      this.yval[j] = this.yrange[0] + (this.yrange[1] - this.yrange[0]) * ty;
    }

    this.pdf = [];
    for (j = 0; j < ny; j++) {
      this.pdf[j] = [];
      for (i = 0; i < nx; i++) {
        this.pdf[j][i] = 0;
      }
    }

    var rdx = (this.xrange[1] - this.xrange[0]) / (nx - 1);
    var rdy = (this.yrange[1] - this.yrange[0]) / (ny - 1);

    for (k = 0; k < this.K; k++) {
      var muk0 = this.mu.get(k, 0);
      var muk1 = this.mu.get(k, 1);
      var c00 = this.cov.get(k, 0, 0);
      var c10 = this.cov.get(k, 1, 0);
      var c11 = this.cov.get(k, 1, 1);
      var det = c00 * c11 - c10 * c10;
      var alphak = this.alpha.get(k);
      for (j = 0; j < ny; j++) {
        var ty = this.yrange[0] + rdy * j;
        var dy = ty - muk1;
        for (i = 0; i < nx; i++) {
          var tx = this.xrange[0] + rdx * i;
          var dx = tx - muk0;
          var d2 = (c11 * dx * dx -  2 * c10 * dx * dy + c00 * dy * dy) / det;

          this.pdf[j][i] += alphak * Math.exp(-0.5 * d2);
        }
      }
    }

    this.pdfMax = -Infinity;
    for (j = 0; j < ny; j++) {
      for (i = 0; i < nx; i++) {
        this.pdf[j][i] = Math.log10(this.pdf[j][i]);
        this.pdfMax = Math.max(this.pdfMax, this.pdf[j][i]);
      }
    }
    var t2 = Date.now();
    //console.log('PDF computed in ' + (t2 - t1) + ' ms');
  },

  initializeModel: function () {
    this.iterationCounter = 0;
    initializeModel(this.points, this.alpha, this.mu, this.cov);
  },

  computeModel: function () {
    gaussianMixtureEM(this.points, this.K, this.alpha, this.mu, this.cov, {maxIterations: 1, initialize: false}, this.status);
    this.means = unpack(this.mu.transpose(1, 0))
    this.iterationCounter++;
  },


  initializePoints: function () {
    var normal = Plotly.d3.random.normal(0, 1);
    var x0 = [];
    var y0 = [];
    var cov = [];
    for (var i = 0; i < this.K; i++) {
      var cov0 = 0.5 + 1.0 * Math.random();
      x0[i] = this.xrange[0] + (0.2 + 0.6 * Math.random()) * (this.xrange[1] - this.xrange[0]);
      y0[i] = this.yrange[0] + (0.2 + 0.6 * Math.random()) * (this.yrange[1] - this.yrange[0]);
      cov[i] = [
        [cov0 * (0.5 + Math.random()), cov0 * (Math.random() - 0.5)],
        [0, cov0 * (0.5 + Math.random())]
      ];
      cov[i][1][0] = cov[i][0][1];
    }

    var eq = 4;
    var proportion = [Math.random() + eq];
    for (i = 1; i < this.K; i++) {
      proportion[i] = proportion[i - 1] + 4 + Math.random();
    }
    for (i = 0; i < this.K; i++) {
      proportion[i] /= proportion[this.K - 1];
    }

    for (var i = 0; i < this.N; i++) {
      var j;
      if (i < this.K) {
        j = i;
      } else {
        j = 0;
        var r = Math.random();
        while (r > proportion[j++]) {}
        j--;
      }
      var c = cov[j];
      var r1 = normal() * 0.5;
      var r2 = normal() * 0.5;
      this.x[i] = x0[j] + r1 * c[0][0] + r2 * c[1][0];
      this.y[i] = y0[j] + r1 * c[0][1] + r2 * c[1][1];
    }

    this.points = pack([this.x, this.y]).transpose(1, 0);
  },

  startIteration: function () {
    if (this.iterating) return;
    this.iterating = true;
    var btn = document.getElementById('action-iterate');
    btn.textContent = 'Stop Iteration';

    this.frame();
  },

  iterationDelay: 25,

  stopIteration: function () {
    if (!this.iterating) return;
    this.iterating = false;
    clearTimeout(this.iterationTimeout);
    this.iterationTimeout = null;

    var btn = document.getElementById('action-iterate');
    btn.textContent = 'Start Iteration';
  },

  startStopIteration: function () {
    if (this.iterating) {
      this.stopIteration();
    } else {
      this.startIteration();
    }
  },

  _iterate: function () {
    return new Promise(function (resolve, reject) {
      this.computeModel();

      this.means = unpack(this.mu.transpose(1, 0))
      this.computePDF();

      Plotly.animate('plot', [{
          x: this.means[0],
          y: this.means[1],
        }, {
          x: this.xval,
          y: this.yval,
          z: this.pdf,
        }],
        {duration: 50},
        [1, 2]
      ).then(resolve);
    }.bind(this));
  },

  _frame: function () {
    if (!this.iterating) return;

    var completion = this.iterate()

    this.log('Iterations: ' + this.iterationCounter + ', relative change: ' + this.status.relativeChange.toFixed(8))

    if (this.status.relativeChange < this.tolerance) {
      this.stopIteration();
      return;
    } else {
      if (this.iterating) {
        completion.then(function () {
          this.iterationTimeout = setTimeout(this.frame, this.iterationDelay);
        }.bind(this));
      }
    }
  },

  log: function(text) {
    var log = document.getElementById('log');
    log.textContent = text;
  },

  _reinitialize: function () {
    pool.free(this.alpha);
    pool.free(this.mu);
    pool.free(this.cov);
    this.alpha =  pool.zeros([this.K]);
    this.mu = pool.zeros([this.K, this.M]);
    this.cov = pool.zeros([this.K, this.M, this.M]);

    this.initializePoints();
    this.initializeModel();
    this.means = unpack(this.mu.transpose(1, 0))
    this.computePDF();

    Plotly.animate('plot', [{
        x: this.x,
        y: this.y,
      }, {
        x: this.means[0],
        y: this.means[1],
      }, {
        x: this.xval,
        y: this.yval,
        z: this.pdf,
      }],
      {duration: 500},
      [0, 1, 2]
    );
  },

  create: function () {
    this.alpha =  pool.zeros([this.K]);
    this.mu = pool.zeros([this.K, this.M]);
    this.cov = pool.zeros([this.K, this.M, this.M]);

    this.frame = this._frame.bind(this);
    this.iterate = this._iterate.bind(this);
    this.reinitialize = this._reinitialize.bind(this);

    window.addEventListener('resize', function () {
      Plotly.relayout('plot', {
        width: window.innerWidth,
        height: window.innerHeight
      });
    });

    var componentInput = document.getElementById('components');

    componentInput.addEventListener('change', function () {
      var K1 = this.K;
      this.K = parseInt(componentInput.value);

      if (this.K !== K1) {
        this.stopIteration();
        this.reinitialize();
      }
    }.bind(this));

    componentInput.addEventListener('mouseup', function () {
      var K1 = this.K;
      this.K = parseInt(componentInput.value);

      if (this.K !== K1) {
        this.stopIteration();
        this.reinitialize();
      }
    }.bind(this));

    document.getElementById('action-randomize').addEventListener('click', function () {
      this.stopIteration();
      this.reinitialize();
    }.bind(this));

    document.getElementById('action-iterate').addEventListener('click', this.startStopIteration.bind(this));

    this.initializePoints();
    this.initializeModel();
    this.means = unpack(this.mu.transpose(1, 0))
    //this.computeModel();
    this.computePDF();

    Plotly.plot('plot', [
      {
        x: this.x,
        y: this.y,
        mode: 'markers',
        name: 'Data',
        marker: {
          color: 'black',
          size: 2,
        },
      },
      {
        x: this.means[0],
        y: this.means[1],
        mode: 'markers',
        name: 'Means',
        marker: {
          color: 'red',
          size: 10
        }
      },
      {
        zauto: false,
        colorscale: [[0, '#fff'], [1, '#555']],
        zmax: this.pdfMax,
        zmin: -4,
        contours: {
          size: 1,
          showlines: true,
          coloring: 'lines',
        },
        line: {
          width: 0.75,
          color: '#000',
        },
        showscale: false,
        x: this.xval,
        y: this.yval,
        z: this.pdf,
        ncontours: 17,
        type: 'contour',
        hoverinfo: 'none',
      }
    ], {
      xaxis: {
        range: this.xrange,
      },
      yaxis: {
        range: this.yrange,
      },
      font: {
        family: '"Computer Modern Serif", sans-serif',
        size: 16,
      },
      margin: {b: 30, l: 30, r: 30, t: 75},
      dragmode: 'pan',
      hovermode: 'closest',
      showlegend: false,
    }, {
      scrollZoom: true
    });
  }
};

plot.create();
