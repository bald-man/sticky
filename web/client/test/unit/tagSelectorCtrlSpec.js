'use strict';

describe('TagSelectorCtrl', function () {
  beforeEach(function () {
    module('stickyApp.services');
    module('stickyApp.controllers');
  });

  var scope;
  var notes;

  beforeEach(module('stickyApp.services'));

  beforeEach(inject(function ($rootScope, $controller, _notes_) {
    notes = _notes_;
    var parentScope = $rootScope.$new();
    parentScope.user = {
      tags: [],
      notes: []
    };
    parentScope.omni = {input: ''};
    scope = parentScope.$new();
    scope.note = {};

    $controller('TagSelectorCtrl', {$scope: scope});
  }));

  describe('clearSearch', function () {
    it('should clear filter', function () {
      scope.omni = {input: 'filter'};
      scope.clearSearch();
      expect(scope.search.text).toEqual('');
    });
  });

  describe('searchPredicate', function () {
    it('should accept matching tags', function () {
      scope.search.text = 'TAG';
      expect(scope.searchPredicate({name: 'tag 1'})).toBeTruthy();
      expect(scope.searchPredicate({name: '2 tags'})).toBeTruthy();
      expect(scope.searchPredicate({name: 'Tag'})).toBeTruthy();

      expect(scope.searchPredicate({name: '123'})).toBeFalsy();
    });
  });

  describe('toggleSelection', function () {
    it('should unselect if selected', function () {
      var tag = {id: 123};
      var tag2 = {id: 456};
      scope.note.tags = [tag, tag2];
      scope.toggleSelection(tag);
      expect(scope.note.tags).not.toContain(tag);
      expect(scope.note.tags).toContain(tag2);
    });

    it('should select if not selected', function () {
      var tag = {id: 345};
      var tag2 = {id: 345};
      scope.note.tags = [tag2];
      scope.toggleSelection(tag);
      expect(scope.note.tags).toContain(tag);
      expect(scope.note.tags).toContain(tag2);
    });

    it('should handle undefined tags', function () {
      var tag = {id: 345};
      scope.toggleSelection(tag);
      expect(scope.note.tags).toContain(tag);
    });
  });

  describe('toggleIfSingle', function () {
    it('should toggle selection if single tag matches filter', function () {
      scope.search.text = 'tag 1';
      scope.note.tags = [];
      scope.user.tags = [
        {id: 101, name: 'tag 1'},
        {id: 102, name: 'tag 2'}
      ];

      spyOn(scope, 'toggleSelection');
      scope.toggleIfSingle();
      expect(scope.toggleSelection).toHaveBeenCalledWith({id: 101, name: 'tag 1'});
    });

    it('should not toggle selection if multiple tags match filter', function () {
      scope.search.text = 'tag';
      scope.note.tags = [];
      scope.user.tags = [
        {id: 101, name: 'tag 1'},
        {id: 102, name: 'tag 2'}
      ];

      spyOn(scope, 'toggleSelection');
      scope.toggleIfSingle();
      expect(scope.toggleSelection).not.toHaveBeenCalled();
    });

    it('should not toggle selection if note tags match filter', function () {
      scope.search.text = 'tag x';
      scope.note.tags = [];
      scope.user.tags = [
        {id: 101, name: 'tag 1'},
        {id: 102, name: 'tag 2'}
      ];

      spyOn(scope, 'toggleSelection');
      scope.toggleIfSingle();
      expect(scope.toggleSelection).not.toHaveBeenCalled();
    });
  });

  describe('isTagSelected', function () {
    it('should report tag selection status', function () {
      scope.note.tags = [
        {id: 101}
      ];

      expect(scope.isTagSelected({id: 101})).toBeTruthy();
      expect(scope.isTagSelected({id: 102})).toBeFalsy();
    });

    it('should handle undefined tags', function () {
      scope.note = {};
      expect(scope.isTagSelected({id: 1})).toBeFalsy();
    });
  });

  describe('createTag', function () {
    it('should create and select a tag and clear the field', function () {
      scope.search = {text: 'My tag'};
      spyOn(notes, 'createTag').andReturn({id: 12, name: 'My tag'});
      scope.createTag();

      expect(notes.createTag).toHaveBeenCalledWith('My tag');
      expect(scope.user.tags).toContain({id: 12, name: 'My tag'});
      expect(scope.note.tags).toContain({id: 12, name: 'My tag'});
      expect(scope.search.text).toEqual('');
    });

    it('should not create an empty tag', function () {
      scope.omni = {input: ''};
      spyOn(notes, 'createTag');
      scope.createTag();

      expect(notes.createTag).not.toHaveBeenCalled();
      expect(scope.user.tags).toEqual([]);
      expect(scope.note.tags).toBeUndefined();
    });
  });
});