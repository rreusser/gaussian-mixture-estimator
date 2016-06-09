"use strict";

module.exports = initializeModel;

var ops = require('ndarray-ops');
var variance = require('./variance');
var show = require('ndarray-show');

function initializeModel (x, alpha, mu, cov) {
  var j, k;
  var N = x.shape[0];
  var M = x.shape[1];
  var K = mu.shape[0];

  console.groupCollapsed('Initial Conditions');

  // Equal probability a randomly selected sample is from a given mixture component:
  ops.assigns(alpha, 1 / K);

  for (k = 0; k < K; k++) {
    ops.assign(mu.pick(k), x.pick(k));
  }
  //console.log('x:\n' + show(x));
  console.log('mu:\n' + show(mu));
  console.log('alpha:\n' + show(alpha));

  // Initialize using population variance in each dim and a random sample for the mean:
  ops.assigns(cov, 0);
  for (j = 0; j < M; j++) {
    // Compute stats in this dim:
    var sig = variance(x.pick(null, j)) / 4;

    // For each mixture component:
    for (k = 0; k < K; k++) {
      mu.set(k, j, x.get(k, j));
      cov.set(k, j, j, sig);
    }
  }

  console.log('cov:\n' + show(cov));

  console.groupEnd();
}
