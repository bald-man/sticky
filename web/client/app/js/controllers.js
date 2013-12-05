'use strict';

/* Controllers */

var saControllers = angular.module('stickyApp.controllers', ['firebase']);

saControllers.controller('MainCtrl', ['$scope', '$location', '$filter', 'angularFire', 'angularFireAuth', 'dataBinder', 'notes',
  function ($scope, $location, $filter, angularFire, angularFireAuth, dataBinder, notes) {
    $scope.firebase = new Firebase("https://sticky-app.firebaseIO.com");

    angularFireAuth.initialize($scope.firebase, {scope: $scope, name: "loggedInUser"});

    $scope.$on("angularFireAuth:login", function (evt, user) {
      // User logged in.
      $scope.loggedInUser = user;
      var user_md5 = md5(user.email);
      var userRef = $scope.firebase.child("users/" + user_md5);
//      userRef.on('value', function (snapshot) {
//        console.log('**** User changed');
//        var result = angular.equals($scope, $scope.user, snapshot.val());
//        console.log('*** user equality: ' + result + ", == " + ($scope.user == snapshot.val()));
//        console.log($filter('json')($scope.user));
//        console.log($filter('json')(snapshot.val()));
      dataBinder($scope, 'user', userRef);
      $location.path('/notes');
      //console.log(angular.toJson($scope.user));

    });


//
//      var noteRef = userRef.child('notes');
//      noteRef.on('value', function () {
//        console.log('***** Notes changed');
//      });
//      noteRef.on('child_added', function () {
//        console.log('***** Notes child added');
//      });
//      noteRef.on('child_removed', function () {
//        console.log('***** Notes child removed');
//      });
//      noteRef.on('child_changed', function (snapshot, prevName) {
//        var note = snapshot.val();
//        console.log('***** Notes child changed ' + $filter('json')(note) + ', prevName ' + prevName);
//
//      });
//      noteRef.on('child_moved', function () {
//        console.log('***** Notes child moved');
//      });
//
//
//      // bind $scope.user to firebase
//      angularFire(userRef, $scope, "user").then(function () {
//        // If this is a first load, init the user object.
//        if (!$scope.user) {
//          $scope.user = {}
//        }
//      });
//
//      $location.path('/notes');
//    });
//
    $scope.$on("angularFireAuth:logout", function (evt) {
      // User logged out.
      $location.path('/login');
    });

    $scope.$on("angularFireAuth:error", function (evt, err) {
      // There was an error during authentication.
      alert('Login failed.');
    });

    $scope.logInGitHub = function () {
      angularFireAuth.login("github");
    };

    $scope.logOut = function () {
      angularFireAuth.logout();
    };

    $location.path('/login');
  }]);

saControllers.controller('TagSelectorCtrl', ['$scope', 'notes', '$filter', '$log',
  function ($scope, notes, $filter, $log) {

    $log.debug('Init TagSelectorCtrl');

    $scope.search = {text: ''};

    $scope.createTag = function () {
      if (!$scope.search.text) {
        return;
      }

      var tag = notes.createTag($scope.search.text);
      $scope.user.tags.push(tag);
      if (!$scope.note.tags) {
        $scope.note.tags = [];
      }
      $scope.note.tags.push(tag);

      $scope.clearSearch();
    };

    $scope.clearSearch = function () {
      $scope.search.text = '';
    };

    $scope.searchPredicate = function (tag) {
      return !$scope.search.text ||
          tag.name.toLowerCase().indexOf($scope.search.text.toLowerCase()) > -1;
    };

    $scope.getDisplayedTags = function () {
      var filtered = $filter('filter')($scope.user.tags, $scope.searchPredicate);
      // Show selected tags first
      // Order by alphabetically
      var ordered = $filter('orderBy')(filtered, ['name']);
      return ordered;
    };

    $scope.toggleSelection = function (tag) {
      if (!$scope.note.tags) {
        $scope.note.tags = [];
      }
      var index = $scope.note.tags.indexOf(tag);
      if (index < 0) {
        $scope.note.tags.push(tag);
      } else {
        $scope.note.tags.splice(index, 1);
      }
    };

    $scope.toggleIfSingle = function () {
      var selected = [];
      angular.forEach($scope.user.tags, function (value, key) {
        if ($scope.searchPredicate(value)) {
          selected.push(value);
        }
      });

      if (selected.length == 1) {
        $scope.toggleSelection(selected[0]);
      }
    };

    $scope.isTagSelected = function (tag) {
      for (var i = 0; $scope.note.tags && i < $scope.note.tags.length; i++) {
        if ($scope.note.tags[i].id == tag.id) {
          return true;
        }
      }

      return false;
    }
  }
]);

saControllers.controller('NotesCtrl', ['$scope', '$document', '$modal', '$filter', '$log', 'notes',
  function ($scope, $document, $modal, $filter, $log, notes) {

    $log.debug('Init NotesCtrl');

    $scope.omni = {input: ''};
    $scope.expanded = [];
    $scope.selected = null;
    $scope._displayedNotes = []; // cached filtered and sorted note list as displayed in the UI

    // Install keyboard handlers
//    $document.on('keydown', function (event) {
//      switch (event.keyCode) {
//        case 38:
//            // Up
//            $scope.selectPrevNote(event);
//            $scope.$digest();
//          break;
//        case 40:
//            // Down
//            $scope.selectNextNote(event);
//            $scope.$digest();
//          break;
//      }
//    });

    // todo: consider reusing the code user to search tags
    $scope.noteSearchPredicate = function (note) {

      var text = $scope.omni.input;

      if (!text) {
        return true;
      }

      text = text.toLowerCase();

      if (note.text.toLowerCase().indexOf(text) > -1) {
        return true;
      }

      for (var i = 0; note.tags && i < note.tags.length; i++) {
        if (note.tags[i].name.toLowerCase().indexOf(text) > -1) {
          return true;
        }
      }

      return false;
    };

    $scope.getDisplayedNotes = function () {
      var filtered = $filter('filter')($scope.user.notes, $scope.noteSearchPredicate);
      var ordered = $filter('orderBy')(filtered, '-created');
      // todo update selected note if it gets filtered out
      return $scope._displayedNotes = ordered;
    };

    $scope.deleteNote = function (note) {
      for (var i = 0; i < $scope.user.notes.length; i++) {
        if ($scope.user.notes[i].id == note.id) {
          $scope.user.notes.splice(i, 1);
        }
      }

      var index = $scope.expanded.indexOf(note.id);
      if (index > -1) {
        $scope.expanded.splice(index, 1);
      }
    };

    $scope.isExpanded = function (note) {
      return $scope.expanded.indexOf(note.id) > -1;
    };

    $scope.toggleExpanded = function (note) {
      var index = $scope.expanded.indexOf(note.id);
      if (index > -1) {
        $scope.expanded.splice(index, 1);
      } else {
        $scope.expanded.push(note.id);
      }
    };

    $scope.showTagsDialog = function () {
      var focused = $document[0].activeElement;
      var instance = $modal.open({
        templateUrl: 'partials/tags.html',
        scope: $scope,
        controller: 'DialogCtrl'
      });
      instance.result.then(undefined, function () {
        if (focused) {
          focused.focus(); // restore focus
        }
      });
    };

    // todo: what are we doing with this?
    function scrollRectangleVisible(element) {

    }

    $scope.selectNextNote = function (event) {
      // todo: test
      // todo: will have to intercept the key presses at the document level
      // todo: figure out how to prevent default handling
      console.log('Next' + event);
      //event.preventDefault();

      var notes = $scope._displayedNotes;

      if (notes.length == 0) {
        return false; // there are no notes
      }

      var index = notes.indexOf($scope.selected);
      if (index < 0) {
        $scope.selected = notes[0];
      } else if (index < notes.length - 1) {
        $scope.selected = notes[index + 1];
      }

      return false;
    };

    $scope.selectPrevNote = function (event) {
      // todo: test
      console.log('Prev' + event);
      event.preventDefault();

      var notes = $scope._displayedNotes;

      if (notes.length == 0) {
        return false; // there are no notes
      }

      var index = notes.indexOf($scope.selected);
      if (index < 0) {
        $scope.selected = notes[0];
      } else if (index > 0) {
        $scope.selected = notes[index - 1];
      }

      return false;
    };
  }
]);


saControllers.controller('DialogCtrl', ['$scope', '$modalInstance',
    function ($scope, $modalInstance) {
      $scope.hideTagDialog = function () {
        $modalInstance.dismiss('cancel');
      };

      $scope.deleteTag = function (tag) {
        // todo: test
        angular.forEach($scope.user.notes, function (note) {
          if (note.tags) {
            var index = note.tags.indexOf(tag);
            if (index > -1) {
              note.tags.splice(index, 1);
            }
          }
        });

        var index = $scope.user.tags.indexOf(tag);
        if (index > -1) {
          $scope.user.tags.splice(index, 1);
        }
      };

      $scope.getNoteReferences = function (tag) {
        // todo: test
        var count = 0;
        angular.forEach($scope.user.notes, function (note) {
          if (note.tags && note.tags.indexOf(tag) > -1) {
            count += 1;
          }
        });
        return count;
      };
    }
]);

saControllers.controller('DialogCtrl2', ['$scope', '$filter', '$document', 'notes', '$log',
  function ($scope, $filter, $document, notes, $log) {

    $scope.showTagSelector = function (note) {
      $scope.tagSelectorVisible = true;
      $scope.selectedNote = note;
      $scope.selectedTags = $scope.buildSelectedTags(note);
      $scope.tagFilter = "";

//      var keyHandler = function (event) {
//        if (event.which == 27) {
//          $document.unbind('keydown', keyHandler);
//          $scope.$apply($scope.cancelTagSelector);
//        } else if (event.which == 13) {
//          $document.unbind('keydown', keyHandler);
//          $scope.$apply($scope.applyTagSelector);
//        }
//      };
//      $document.bind('keydown', keyHandler);

      var mouseHandler = function (event) {
        event.stopPropagation();
      };
      $document.on('DOMMouseScroll mousewheel', mouseHandler);
    };

    $scope.buildSelectedTags = function (note) {
      var selectedTags = [];
      var availableTags = $scope.user.tags;
      for (var i = 0; availableTags && i < availableTags.length; i++) {
        var selectedTag = {
          selected: note.tags && note.tags.indexOf(availableTags[i].id) > -1,
          tag: availableTags[i]
        };
        selectedTags.push(selectedTag);
      }
      return selectedTags;
    };

    $scope.cancelTagSelector = function () {
      $scope.tagSelectorVisible = false;
    };

    $scope.applyTagSelector = function () {
      $scope.tagSelectorVisible = false;
      var tagIds = [];
      for (var i = 0; i < $scope.selectedTags.length; i++) {
        if ($scope.selectedTags[i].selected) {
          tagIds.push($scope.selectedTags[i].tag.id);
        }
      }
      $scope.selectedNote.tags = tagIds;
    };

    $scope.addTag = function ($event) {
//      if ($event.keyCode == 13 && $scope.newTag && $scope.newTag.trim()) {
//        var newTag = {
//          "id": Math.random(),
//          "name": $scope.newTag
//        };
//        if (!$scope.user.tags) {
//          $scope.user.tags = [];
//        }
//        $scope.user.tags.push(newTag);
//        $scope.newTag = "";
//        if (!$scope.selectedNote.tags) {
//          $scope.selectedNote.tags = [];
//        }
//        $scope.selectedNote.tags.push(newTag.id); // make sure the new note is selected
//        $scope.selectedTags = $scope.buildSelectedTags($scope.selectedNote);
//      }
    };

    $scope.editTag = function (selectedTag) {
      $scope.editedTag = selectedTag;
    }
  }]);
