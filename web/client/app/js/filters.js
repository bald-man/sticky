'use strict';

/* Filters */

var stickyFilters = angular.module('stickyApp.filters', []);

stickyFilters.filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }]);
