'use strict';

/* Services */


var stickyServices = angular.module('stickyApp.services', ['ngResource']);

stickyServices.factory('notes', ['$resource', function ($resource) {
  return {
    guid: function ($resource) {
      return Math.random();
      //return $resource('http://www.fileformat.info/tool/guid.htm?count=1&format=text');
    },

    createTag: function (name) {
      return {
        id: this.guid($resource),
        name: name,
        created: new Date().getTime()
      };
    },

    createNote: function (text) {
      return {
        id: this.guid($resource),
        text: text,
        created: new Date().getTime()
      }
    },

    add: function (user, note, tag) {
      var result = {};

      if (note && note.toString() != "[object Object]") {
        note = this.createNote(note);
        user.notes.push(note);
        result.note = note;
      }

      if (tag && tag.toString() != "[object Object]") {
        tag = this.createTag(tag);
        user.tags.push(tag);
        result.tag = tag;
      }

      if (note && tag) {
        if (note.tags === undefined) {
          note.tags = [];
        }
        note.tags.push(tag);
      }

      return result;
    }
  };
}]);

stickyServices.factory('dataBinder', ['$parse', '$timeout',
  function ($parse, $timeout) {
    return function (scope, name, firebaseUserRef) {
      var notes = new DataBinder($parse, $timeout);
      notes._associate(scope, name, firebaseUserRef);
      return notes;
    };
  }
]);

var DataBinder;

DataBinder = function ($parse, $timeout) {
  this._parse = $parse;
  this._timeout = $timeout;
};

DataBinder.prototype = {
  _associate: function ($scope, name, userRef) {
    var self = this;
    var updatePromise = null;
    this._user = new User();
    this._parse(name).assign($scope, this._user);

    userRef.on('value', function (snapshot) {
      $scope.$apply(function () {
        console.log('Restore user');
          self._user.restore(snapshot.val());
      });
    });

    $scope.$watch(name, function (newVal, oldVal) {
      if (newVal === oldVal) {
        return; // initialization
      }

      // Cancel an outstanding timeout
      if (updatePromise !== null) {
        self._timeout.cancel(updatePromise);
      }

      // Reschedule for an update
      updatePromise = self._timeout(function () {
        updatePromise = null;
        self._saveUser(userRef);
      }, 1000);
    }, true);
  },

  _saveUser: function (userRef) {
    console.log('Save user');
    var serialized = this._user.save({});
    userRef.set(serialized);
  }
};

var User;

User = function () {
  this.notes = [];
  this.tags = [];
};

User.prototype = {
  restore: function (source) {
    this.restoreTags(source.tags);
    this.restoreNotes(source.notes);
  },

  save: function (dest) {
    this.saveTags(dest);
    this.saveNotes(dest);
    return dest;
  },

  restoreNotes: function (sources) {
    for (var i = 0; sources && i < sources.length; i++) {
      var source = sources[i];
      var dest = this._findOrCreate(this.notes, source.id);
      angular.copy(source, dest);
      // Remap tag ids to tags
      if (angular.isDefined(source.tags)) {
        dest.tags = this._filterByIds(this.tags, source.tags);
      }
    }

    // Remove stale
    this._retain(this.notes, this._toIds(sources));
  },

  /**
   * @description Serializes the notes.
   * @param dest
   */
  saveNotes: function (dest) {
    // Make a copy of the notes array
    dest.notes = angular.copy(this.notes, []);

    // For each note, re-map tags to tag ids
    angular.forEach(dest.notes, function (note) {
      note.tags = this._toIds(note.tags);
    }, this);

    // Drop the notes if it is empty
    if (dest.notes.length == 0) {
      delete dest.notes;
    }
  },

  /**
   * @description Deserializes the tags.
   * @param {Array} sources tags in persisted format
   */
  restoreTags: function (sources) {
    for (var i = 0; sources && i < sources.length; i++) {
      var source = sources[i];
      // Make sure we update an existing tang before adding a new.
      var dest = this._findOrCreate(this.tags, source.id);
      angular.copy(source, dest); // model is a 1:1 copy of persistent data
    }

    // Delete the old tags
    this._retain(this.tags, this._toIds(sources));
  },

  /**
   * @description serializes the tags into the persistent format
   * @param {Object} dest an object whose tags property will be populated
   * @return {Object} dest
   */
  saveTags: function (dest) {
    dest.tags = angular.copy(this.tags, []);
    if (dest.tags.length == 0) {
      delete dest.tags;
    }
    return dest;
  },

  /**
   * @description Returns item ids.
   * @param {Array} items an array of items
   * @returns {Array} an array of item ids
   * @private
   */
  _toIds: function (items) {
    var ids = [];
    angular.forEach(items, function (item) {
      ids.push(item.id);
    });
    return ids;
  },

  /**
   * @description Filters the item array to contain only those whose ids match the provided ids.
   * @param {Array} items items to be filtered
   * @param {Array} ids ids of items that should be retained
   * @returns {Array} an arra of filtered items
   * @private
   */
  _filterByIds: function (items, ids) {
    var selected = [];
    angular.forEach(items, function (item) {
      if (ids.indexOf(item.id) > -1) {
        selected.push(item);
      }
    });
    return selected;
  },

  /**
   * @description Always returns an item attempts to find an existing and creating one if necessary.
   * @param items items to search
   * @param id item id
   * @returns {Object} an existing item with the given id or a brand new item if one could not be found
   * @private
   */
  _findOrCreate: function (items, id) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id == id) {
        return items[i];
      }
    }

    var item = {id: id};
    items.push(item);
    return item;
  },

  /**
   * @description Modifies the existing array to drop those items whose ids are absent.
   * @param {Array} items item array to be modified
   * @param {Array} ids item ids of those items that should be kept
   * @private
   */
  _retain: function (items, ids) {
    for (var i = 0; i < items.length;) {
      if (ids.indexOf(items[i].id) > -1) {
        i++;
      } else {
        items.splice(i, 1);
      }
    }
  }
};