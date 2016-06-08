'use strict';

module.exports = variance;

var mean = require('./mean');

function variance (x) {
  var i, dx;
  var sg = 0;
  var mu = mean(x);
  var N = x.shape[0];
  for (i = N - 1; i >= 0; i--) {
    dx = x.get(i) - mu;
    sg += dx * dx;
  }
  return sg / (N - 1);
}
