
"use strict";

module.exports = computeLogLikelihood;

function computeLogLikelihood (x, w, alpha, mu, cov) {
  var i, k, logL, sum;
  var N = w.shape[0];
  var K = w.shape[1];
  var M = x.shape[1];

  // sum_N log( sum_K alpha_k * p_k( x_i | zk, thetak))


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

    }
  }

  return logL;
}
