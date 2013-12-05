'use strict';

describe('NotesCtrl', function () {
  beforeEach(function () {
    module('stickyApp.services');
    module('stickyApp.controllers');
  });

  var scope;
  var notes;
  var modal = jasmine.createSpy('$modal');

  beforeEach(inject(function ($controller, $rootScope, _notes_) {
    scope = $rootScope.$new();
    notes = _notes_;
    $controller('NotesCtrl', {$scope: scope, $modal: modal, notes: _notes_});
  }));

  describe('noteSearchPredicate', function () {
    it('should accept notes with matching text', function () {
      scope.omni.input = 'NOTE';
      expect(scope.noteSearchPredicate({text: 'a note'})).toBeTruthy();
      expect(scope.noteSearchPredicate({text: 'note that'})).toBeTruthy();
      expect(scope.noteSearchPredicate({text: 'Note'})).toBeTruthy();

      expect(scope.noteSearchPredicate({text: 'not'})).toBeFalsy();
    });

    it('should accept notes when omni text is empty', function () {
      scope.omni.input = '';
      expect(scope.noteSearchPredicate({text: 'a note'})).toBeTruthy();
    });

    it('should accept notes with matching tags', function () {
      scope.omni.input = 'TAG';
      expect(scope.noteSearchPredicate({text: '', tags: [
        {name: 'a tag'}
      ]})).toBeTruthy();
      expect(scope.noteSearchPredicate({text: '', tags: [
        {name: 'tag that'}
      ]})).toBeTruthy();
      expect(scope.noteSearchPredicate({text: '', tags: [
        {name: 'Tag'}
      ]})).toBeTruthy();

      expect(scope.noteSearchPredicate({text: '', tags: [
        {name: 'next'}
      ]})).toBeFalsy();
      expect(scope.noteSearchPredicate({text: '', tags: []})).toBeFalsy();
    });
  });

  describe('getDisplayedNotes', function () {
    beforeEach(function () {
      scope.user = {};
    });

    it('should sort notes by creation date', function () {
      scope.user.notes = [
        {text: 'a', created: 1},
        {text: 'z', created: 2}
      ];

      expect(scope.getDisplayedNotes()).toEqual([
        {text: 'z', created: 2},
        {text: 'a', created: 1}
      ]);
    });

    it ('should apply the filter', function () {
      scope.user.notes = [
        {text: 'note one', created: 1},
        {text: 'note two', created: 2}
      ];

      scope.omni.input = 'one';

      expect(scope.getDisplayedNotes()).toEqual([
        {text: 'note one', created: 1}
      ]);
    });

    it ('should init cached notes', function () {
      scope.user.notes = [{text: 'a'}];

      expect(scope._displayedNotes).toEqual([]);
      scope.getDisplayedNotes();
      expect(scope._displayedNotes).toEqual([{text: 'a'}]);

    });
  });

  describe('deleteNote', function () {
    it('should delete a note and remove it from the expanded state array', function () {
      scope.user = {};
      scope.user.notes = [
        {id: 101, text: 'note 1'},
        {id: 201, text: 'note 2'}
      ];
      scope.expanded = [101, 201];

      scope.deleteNote({id: 201});
      expect(scope.user.notes).toEqual([
        {id: 101, text: 'note 1'}
      ]);
      expect(scope.expanded).toEqual([101]);
    });

    it('should handle bogus notes', function () {
      scope.user = {notes: []};
      scope.deleteNote({id: 1}); // nothing should blow up
    });
  });

  describe('toggleExpanded', function () {
    it('should expand if collapsed', function () {
      scope.user = {};
      scope.user.notes = [
        {id: 101, text: 'note 1'},
        {id: 201, text: 'note 2'}
      ];

      scope.toggleExpanded({id: 101});
      scope.toggleExpanded({id: 201});
      expect(scope.expanded).toEqual([101, 201]);

      scope.toggleExpanded({id: 101});
      expect(scope.expanded).toEqual([201]);
    });
  });
});
