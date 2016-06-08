'use strict';

var assert = require('chai').assert;
var gaussianMixtureEm = require('../');

describe('gaussian-mixture-estimator', function () {
  it('passes a test', function () {
    assert(gaussianMixtureEm());
  });
});
