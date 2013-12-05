'use strict';

/* jasmine specs for services go here */

describe('service', function () {
  beforeEach(module('stickyApp.services'));

  describe('notes', function () {
    var notes;

    beforeEach(inject(function ($resource, _notes_) {
      notes = _notes_;
    }));

    /** todo update to reflect reality */
    xdescribe('add', function () {
      it('should create notes property when adding first note', inject(function (Notes) {
        var user = {};
        Notes.add(user, 'Text');
        expect(user.notes).toBeDefined();
        expect(user.notes).toEqual([
          {text: 'Text'}
        ]);
      }));

      it('should append a note to existing notes', inject(function (Notes) {
        var user = {};
        Notes.add(user, 'First');
        Notes.add(user, 'Second');
        expect(user.notes).toEqual([
          {text: 'First'},
          {text: 'Second'}
        ]);
      }));
    });

    xdescribe('createTag', function () {
      it('should create tag', function () {
        spyOn(notes, 'guid').andReturn(123);

        var tag = notes.createTag('My tag');
        expect(tag).toEqual({id: 123, name: 'My tag'});
      });
    });

  });

  describe('trying out extend', function () {
    var scope;
    var parse;
    beforeEach(inject(function ($rootScope, $parse) {
      console.log('##########beforeEach2');
      scope = $rootScope.$new();
      parse = $parse;
    }));

    describe('doing something', function () {
      it('should do something', function () {

        var user = {
          notes: [
            {text: 'One', tags: [1]},
            {text: 'Two', tags: [2]}
          ]
        };

        scope.$watch('user', function (newUser, oldUser) {
          //if (newUser !== oldUser)
          console.log("User: " + angular.toJson(newUser));
        }, true);

        scope.$watch(parse('user.notes'), function (newNotes, oldNotes) {
          //if (newNotes !== oldNotes)
          console.log("Notes: " + angular.toJson(newNotes));
        }, true);

        scope.$watch(parse('user.notes[0]'), function (newNote, oldNote) {
          //if (newNote !== oldNote)
          console.log("Note[0]: " + angular.toJson(newNote));
        }, true);

        scope.$watch(parse('user.notes[1]'), function (newNote, oldNote) {
          //if (newNote !== oldNote)
          console.log("Note[1]: " + angular.toJson(newNote));
        }, true);

        //scope.user.name = 'name';

        //scope.user.notes[0].text = 'new text';

//          scope.$apply(function () {
//            scope.user = user;
//          });

        scope.user = user;

        //scope.$apply();
        scope.$digest();

        console.log('***************************Ignore before this line');

        scope.$apply(function () {
          user.notes = [];
        });


        //scope.user.name = 'name';
        scope.$apply(function () {
          user.notes = [
            {text: 'One', tags: [1]},
            {text: 'Two', tags: [2]}
          ];
        });

        //scope.$digest();
      });
    });
  });

  describe('User', function () {
    describe('constructor', function () {
      it('should create empty notes and tags arrays', function () {
        var user = new User();
        expect(user.notes).toEqual([]);
        expect(user.tags).toEqual([]);
      });
    });

    describe('restore', function () {
      var user;
      beforeEach(function () {
        user = new User;
      });

      it('should handle restoring empty user object', function () {
        user.restore({});
      });

      it('should leave original notes array', function () {
        var original = user.notes;
        user.restore({notes: []});
        expect(user.notes).toBe(original);
      });

      it('should leave original tags array', function () {
        var original = user.tags;
        user.restore({notes: []});
        expect(user.tags).toBe(original);
      });

      it('should fill in the original notes array', function () {
        var original = user.notes;
        user.restore({notes: [
          {text: 'note'}
        ]});
        expect(user.notes).toBe(original);
        expect(user.notes).toEqual([
          {text: 'note'}
        ]);
      });

      it('should fill in the original tags array', function () {
        var original = user.tags;
        user.restore({tags: [
          {name: 'tag'}
        ]});
        expect(user.tags).toBe(original);
        expect(user.tags).toEqual([
          {name: 'tag'}
        ]);
      });

      it('should override existing note but not delete it', function () {
        var originalNote = {id: 1, text: 'original note'};
        user.notes.push(originalNote);
        user.restore({notes: [
          {id: 1, text: 'new note'}
        ]});
        expect(user.notes[0]).toBe(originalNote);
        expect(user.notes).toEqual([
          {id: 1, text: 'new note'}
        ]);
      });

      it('should override existing tag but not delete it', function () {
        var originalTag = {id: 1, name: 'original tag'};
        user.tags.push(originalTag);
        user.restore({tags: [
          {id: 1, name: 'new tag'}
        ]});
        expect(user.tags[0]).toBe(originalTag);
        expect(user.tags).toEqual([
          {id: 1, name: 'new tag'}
        ]);
      });

      it('should delete the absent notes', function () {
        user.notes.push({id: 1, text: 'one'});
        user.notes.push({id: 2, text: 'two'});
        user.notes.push({id: 4, text: 'four'});
        user.restore({notes: [
          {id: 2, text: 'updated two'},
          {id: 3, text: 'updated three'}
        ]});
        expect(user.notes).toEqual([
          {id: 2, text: 'updated two'},
          {id: 3, text: 'updated three'}
        ]);
      });

      it('should delete the absent tags', function () {
        user.tags.push({id: 1, name: 'one'});
        user.tags.push({id: 2, name: 'two'});
        user.tags.push({id: 4, name: 'four'});
        user.restore({tags: [
          {id: 2, name: 'updated two'},
          {id: 3, name: 'updated three'}
        ]});
        expect(user.tags).toEqual([
          {id: 2, name: 'updated two'},
          {id: 3, name: 'updated three'}
        ]);
      });

      it('should translate tag ids to tags for selected tags', function () {
        user.restore({
          notes: [
            {id: 1, text: 'note', tags: [100]}
          ],
          tags: [
            {id: 100, name: 'tag'}
          ]
        });
        expect(user.notes).toEqual([
          {
            id: 1,
            text: 'note',
            tags: [
              {id: 100, name: 'tag'}
            ]
          }
        ]);
        expect(user.notes[0].tags[0]).toBe(user.tags[0]);
      });

      it('should translate tag ids to tags for selected tags', function () {
        user.notes.push({id: 1, text: 'note', tags: [100]});
        user.tags.push({id: 100, name: 'tag'});
        //user.restore();
      });
    });

    describe('save', function () {
      var user;
      beforeEach(function () {
        user = new User;
      });

      it('should handle saving an empty object', function () {
        var dest = user.save({});
        expect(dest).toEqual({});
      });

      it('should save tags', function () {
        user.tags.push({id: 100, name: 'tag'});
        var dest = user.save({});
        expect(dest).toEqual({
          tags: [
            {id: 100, name: 'tag'}
          ]
        });
      });

      it ('should save notes', function () {
        var tag = {id: 100, name: 'tag'};
        user.notes.push({id: 1, text: 'note', tags: [tag]});
        user.tags.push(tag);
        var dest = user.save({});
        expect(dest).toEqual({
          notes: [
            {id: 1, text: 'note', tags: [100]}
          ],
          tags: [
            {id: 100, name: 'tag'}
          ]
        });
      });
    });
  });
});
