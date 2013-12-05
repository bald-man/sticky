'use strict';

/** Omnibox. */

var saOmnibox = angular.module('sa.omnibox', []);

var Omni;

Omni = function () {
  /** Text entered by the user. */
  this.input = '';

  /** Text with all the markup stripped. */
  this.stripped = '';

  /** Tokenized input used to filter notes. */
  this.noteFrags = [];

  /** Tokenized input derived from the markup used to search for tags. */
  this.tagFrags = [];
};

Omni.prototype = {
  _TAG_PREFIX: 'tag:',

  clear: function () {
    this.input = '';
    this.stripped = '';
    this.noteFrags = [];
    this.tagFrags = [];
  },

  isClear: function () {
    return this.input == 0 && this.stripped.length == 0 && this.noteFrags.length == 0 && this.tagFrags.length == 0;
  },

  parse: function () {
    var stripped = [];
    var noteFrags = [];
    var tagFrags = [];
    var lines = this.input.trim().split('\n');
    for (var i = 0; i < lines.length; i++) {
      if (i == lines.length - 1) {
        // Look for tags on the last line only
        var tagIndex = lines[i].indexOf(this._TAG_PREFIX);
        if (tagIndex > -1) {
          angular.forEach(lines[i].slice(tagIndex + this._TAG_PREFIX.length).split(','), function (value) {
            value = value.trim().toLowerCase();
            if (value && tagFrags.indexOf(value) < 0) {
              tagFrags.push(value);
            }
          });
          lines[i] = lines[i].slice(0, tagIndex); // strip the tags from the line
        }
      }

      stripped.push(lines[i].trim());

      angular.forEach(lines[i].split(' '), function (value) {
        value = value.trim().toLowerCase();
        if (value && noteFrags.indexOf(value) < 0) {
          noteFrags.push(value);
        }
      });
    }

    this.stripped = stripped.join('\n').trim();
    this.noteFrags = noteFrags;
    this.tagFrags = tagFrags;
// todo: should probably count lines as well instead of implementing separate getOmniboxRowCount
  }
};

saOmnibox.controller('OmniboxCtrl', ['$scope', '$timeout', '$log', 'notes',
  function ($scope, $timeout, $log, notes) {

    $log.debug('Init OmniboxCtrl');

    $scope.omni = new Omni();

    if (angular.isUndefined($scope.filtered)) {
      console.warn('$scope.filtered is undefined. Adding filtered to root scope.');
      $scope.$root.filtered = {};
    }

    $scope.filtered.notes = [];
    $scope.filtered.tags = [];

    // Coalesce parsing triggers to avoid bogging down the UI
    var parsePromise = null;
    $scope.$watch('omni.input', function () {
      if (parsePromise !== null) {
        $timeout.cancel(parsePromise);
      }

      parsePromise = $timeout(forceUpdateFiltered, 500);
    });

    function forceUpdateFiltered() {
      if (parsePromise !== null) {
        $timeout.cancel(parsePromise);
        parsePromise = null;
        updateFiltered();
      }
    }

    /**
     * @description Clears the contents of the omnibox.
     */
    $scope.clearOmni = function () {
      $scope.omni.clear();
    };

    /**
     * @description Creates and adds a new note to the note list.
     */
    $scope.createNote = function () {
      forceUpdateFiltered();

      if ($scope.omni.stripped) {
        var note = notes.createNote($scope.omni.stripped);
        if ($scope.filtered.tags.length > 0) {
          note.tags = $scope.filtered.tags;
        }

        if (!$scope.user.notes) {
          $scope.user.notes = [];
        }
        $scope.user.notes.push(note);
      }

      $scope.clearOmni();
    };

    $scope.expandNote = function () {
      // todo think about
    };


    /**
     * @description Passes the items through the filter. Only those items whose text contains one or more fragments
     * pass the filter.
     * @param {Array} frags an array of string fragments expected to be converted to lower case.
     * @param {Array} items an array of items to be filtered.
     * @param itemTextFn a function that converts the item to a string to be matched against the frags. The string will
     * be converted to lower case before attempting a match.
     * @returns {Array} an array of items that passed the filter
     * @private
     */
    function filterByFrags(frags, items, itemTextFn) {
      var filtered = [];
      angular.forEach(items, function (value) {
        var text = itemTextFn(value).toLowerCase();
        for (var i = 0; i < frags.length; i++) {
          if (text.indexOf(frags[i]) > -1) {
            filtered.push(value);
            break;
          }
        }
      });
      return filtered;
    }

    /**
     * @description Parses the omnibox and updates the filtered notes.
     */
    function updateFiltered () {
      $scope.omni.parse();

      var tags = filterByFrags($scope.omni.tagFrags, $scope.user.tags, function (tag) {
        return tag.name;
      });

      // Filter notes by note frags
      var notes = filterByFrags($scope.omni.noteFrags, $scope.user.notes, function (note) {
        return note.text;
      });

      // Add notes that also pass tag frag filter
      angular.forEach($scope.user.notes, function (note) {
        if (notes.indexOf(note) < 0) {
          for (var i = 0; note.tags && i < note.tags.length; i ++) {
            if (tags.indexOf(note.tags[i]) > -1) {
              notes.push(note);
              break;
            }
          }
        }
      });

      $scope.filtered.tags = tags;
      $scope.filtered.notes = notes;
    }
  }
]);
