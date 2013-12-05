'use strict';


// Declare app level module which depends on filters, and services
angular.module('stickyApp', [
  'ngRoute',
  'ui.bootstrap',
  'ui.keypress',
  'monospaced.elastic',
  'stickyApp.filters',
  'stickyApp.services',
  'stickyApp.directives',
  'stickyApp.controllers',
  'sa.omnibox'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: 'MainCtrl'});
  $routeProvider.when('/notes', {templateUrl: 'partials/notes.html', controller: 'NotesCtrl'});
  $routeProvider.otherwise({redirectTo: '/login'});
}]).
config(['$logProvider', function($logProvider) {
  $logProvider.debugEnabled();
}]);
