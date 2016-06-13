"use strict";

module.exports = initializeModel;

var ops = require('ndarray-ops');
var variance = require('./variance');
var show = require('ndarray-show');
var unpack = require('ndarray-unpack');
var kmpp = require('kmpp');
var ndarray = require('ndarray');
var pack = require('ndarray-pack');
var pool = require('ndarray-scratch');
var gemm = require('ndarray-gemm');

function initializeModel (x, alpha, mu, cov) {
  var i, j, k;
  var N = x.shape[0];
  var M = x.shape[1];
  var K = mu.shape[0];

  console.groupCollapsed('Initial Conditions');

  var unpacked = unpack(x);
  var km = kmpp(unpacked, {k: K, maxIterations: 100});

  for (k = 0; k < K; k++) {
    ops.assign(mu.pick(k), ndarray(km.centroids[k]));
  }
  console.log('mu:\n' + show(mu));

  for (k = 0; k < K; k++) {
    alpha.set(k, km.counts[k] / N);
  }
  console.log('alpha:\n' + show(alpha));

  // Compute sum [(x - mu) * (x - mu)^T]:
  ops.assigns(cov, 0);
  var muk = [];
  var covk = [];
  for (k = 0; k < K; k++) {
    muk[k] = ndarray(km.centroids[k]);
    covk[k] = cov.pick(k);
  }

  var xmuk = pool.zeros([M, 1]);
  var xmukT = xmuk.transpose(1, 0);
  var xmukV = xmukV = xmukT.pick(0);

  for (i = 0; i < N; i++) {
    var k = km.assignments[i];
    ops.sub(xmukV, x.pick(i), muk[k]);
    gemm(covk[k], xmuk, xmukT, 1 / Math.max(1, km.counts[k] - 1), 1);
  }

  console.log('cov:\n' + show(cov));

  console.groupEnd();
}
