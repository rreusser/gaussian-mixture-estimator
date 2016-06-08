'use strict';

module.exports = mean;

var ops = require('ndarray-ops');

function mean (x) {
  return ops.sum(x) / x.shape[0];
}
