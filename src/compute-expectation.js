'use strict';

module.exports = computeExpectation;

var determ = require('ndarray-determinant');
var pool = require('ndarray-scratch');
var ops = require('ndarray-ops');
var show = require('ndarray-show');
var lup = require('ndarray-lup-factorization');
var solve = require('ndarray-lup-solve');
var blas = require('ndarray-blas-level1');

function computeExpectation (x, w, alpha, mu, cov, status) {
  var i, j, k, xmuki, sum, muk, covk, norm, value, alphak;
  var N = w.shape[0];
  var K = w.shape[1];
  var M = x.shape[1];

  // Work space:
  var P = [];
  var covInv = pool.zeros([M, M]);
  var xmu = pool.zeros([M]);
  var covInvXmu = pool.zeros([M]);
  var pik = pool.zeros([N, K]);
  var psum = pool.zeros([N]);

  // Compute (x - mu)^T * cov^-1 * (x - mu):
  for (k = 0; k < K; k++) {
    covk = cov.pick(k);
    alphak = alpha.get(k);

    // Compute the normalization of the multivariate normal distrubutions,
    norm = 1 / Math.sqrt(Math.pow(2 * Math.PI, M) * determ(covk));

    // Factor the covariance matrix:
    ops.assign(covInv, covk);
    lup(covInv, covInv, P);

    muk = mu.pick(k);

    for (i = 0; i < N; i++) {

      // Subtract x - mu:
      ops.sub(xmu, x.pick(i), muk)

      // Copy covInvXmu <- xmu for input into the inversion:
      ops.assign(covInvXmu, xmu);

      // Solve cov^-1 * (x - mu)
      solve(covInv, covInv, P, covInvXmu);

      // Compute the final PDF value:
      value = norm * Math.exp(-0.5 * blas.dot(xmu, covInvXmu));

      // Weight by alpha:
      value *= alphak;

      psum.set(i, psum.get(i) + value);
      w.set(i, k, value);
    }
  }

  // Divide by the normalization (sum over K):
  for (k = 0; k < K; k++) {
    ops.diveq(w.pick(null, k), psum);
  }

  // Compute the log likelihood as part of this step since
  // we've already computed all of the info:
  if (status) {
    status.logLikelihood = ops.sum(ops.logeq(psum));
  }

  pool.free(xmu);
  pool.free(covInvXmu);
  pool.free(covInv);
  pool.free(psum);

  return w;
}
