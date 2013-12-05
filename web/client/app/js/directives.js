'use strict';

/* Directives */

var stickyDirectives = angular.module('stickyApp.directives', []);

stickyDirectives.directive('appVersion', ['version', function (version) {
  return function (scope, elm, attrs) {
    elm.text(version);
  };
}]);

/* Does not seem to work. */
//stickyDirectives.directive('onEnter', function () {
//  return function (scope, element, attrs) {
//    element.bind("keydown keypress", function (event) {
//      if (event.which === 13) {
//        scope.$apply(function () {
//          scope.$eval(attrs.onEnter);
//        });
//
//        event.preventDefault();
//      }
//    });
//  };
//});

/* Focuses an element. */
stickyDirectives.directive('gFocus', function ($timeout) {
  return function (scope, element, attrs) {
    scope.$watch(attrs.gFocus, function (value) {
      if (value) {
        $timeout(function () {
          element[0].focus();
        }, 500);
      }
    });
  };
});