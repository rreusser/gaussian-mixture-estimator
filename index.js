'use strict';

module.exports = gaussianMixtureEM;

var show = require('ndarray-show');
var pack = require('ndarray-pack');
var isndarray = require('isndarray');
var pool = require('ndarray-scratch');

var initializeModel = require('./src/initialize-model');
var computeExpectation = require('./src/compute-expectation');
var computeMaximization = require('./src/compute-maximization');

function gaussianMixtureEM (x, K, alpha, mu, cov, options, status) {
  var iter;

  x = isndarray(x) ? x : pack(x);

  options = options || {};
  var maxIters = options.maxIterations === undefined ? 20 : options.maxIterations;
  var initialize = options.initialize === undefined ? true : options.initialize;
  var verbose = options.verbose === undefined ? false : options.verbose;
  var tolerance = options.tolerance === undefined ? 1e-5 : options.tolerance;

  var N = x.shape[0];
  var M = x.shape[1];
  var w = pool.zeros([N, K]);

  // For passing extra state:
  status = status || {};

  if (initialize) {
    initializeModel(x, alpha, mu, cov);
  }

  var pLogLikelihood = status.logLikelihood === undefined ? Infinity : status.logLikelihood;
  var logLikelihood;

  for (iter = 0; iter < maxIters; iter++) {
    var t1 = Date.now();

    computeExpectation(x, w, alpha, mu, cov, status);

    status.relativeChange = Math.abs((status.logLikelihood - pLogLikelihood) / status.logLikelihood)
    if (isFinite(status.logLikelihood) && status.relativeChange < tolerance) {
      //break;
    }
    pLogLikelihood = status.logLikelihood;

    var t2 = Date.now();

    computeMaximization(x, w, alpha, mu, cov);

    var t3 = Date.now();

    if (verbose) {
      console.groupCollapsed('Iteration #' + iter + ': expectation step:' + (t2 - t1) + ' ms, maximization step: + ' + (t3 - t2) + ' ms');
      console.log('alpha\n' + show(alpha));
      console.log('mu:\n' + show(mu));
      console.log('cov:\n' + show(cov));
      console.groupEnd();
    }
  }

  return [alpha, mu, cov];
}
