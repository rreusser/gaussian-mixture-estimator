"use strict";

module.exports = computeMaximization;

var ops = require('ndarray-ops');
var show = require('ndarray-show');
var gemm = require('ndarray-gemm');
var pool = require('ndarray-scratch');

function computeMaximization (x, w, alpha, mu, cov) {
  var i, j, k, covk, wik, xmuk, muk, Nk;
  var N = w.shape[0];
  var K = w.shape[1];
  var M = x.shape[1];

  var xmuk = pool.zeros([M, 1]);
  var xmukT = xmuk.transpose(1, 0);
  var xmukV = xmukV = xmukT.pick(0);

  // Update alpha:
  for (k = 0; k < K; k++) {
    alpha.set(k, ops.sum(w.pick(null, k)));
  }
  ops.mulseq(alpha, 1 / N);

  // Update mu:
  gemm(mu, w.transpose(1, 0), x);
  for (i = 0; i < M; i++) {
    var mui = mu.pick(null, i);
    ops.diveq(mui, alpha);
    ops.mulseq(mui, 1 / N);
  }


  // Update the covariance:
  ops.assigns(cov, 0);
  for (k = 0; k < K; k++) {
    covk = cov.pick(k);
    muk = mu.pick(k);
    Nk = alpha.get(k) * N;

    for (i = 0; i < N; i++) {
      ops.sub(xmukV, x.pick(i), muk);
      gemm(covk, xmuk, xmukT, w.get(i, k) / Nk, 1);
    }
  }

  pool.free(xmuk);
}
