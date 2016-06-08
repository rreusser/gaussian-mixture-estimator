# gaussian-mixture-estimator

> Estimate a Gaussian Mixture model using the Expectation Maximation (EM) algorithm

Fits an n-dimensional Gaussian Mixture to data using the Expectation Maximization (EM) algorithm.

Demo at: http://rickyreusser.com/gaussian-mixture-estimator/

## Example

Not currently on npm. Pass it a list of n-dimensional coordinates (1D must currently be wrapped in an array) and specify the number of mixture components. More documentation to come.

```javascript
var estimate = require('gaussian-mixture-estimator')

estimate(
  [[x1, y1, ...],
   [x2, y2, ...],
   [x3, y3, ...],
    ...
  ],
  5
);
```


## License

&copy; 2016 Ricky Reusser. MIT License.

[npm-image]: https://badge.fury.io/js/gaussian-mixture-estimator.svg
[npm-url]: https://npmjs.org/package/gaussian-mixture-estimator
[travis-image]: https://travis-ci.org/rreusser/gaussian-mixture-estimator.svg?branch=master
[travis-url]: https://travis-ci.org//gaussian-mixture-estimator
[daviddm-image]: https://david-dm.org/rreusser/gaussian-mixture-estimator.svg?theme=shields.io
[daviddm-url]: https://david-dm.org//gaussian-mixture-estimator
