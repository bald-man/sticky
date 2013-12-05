'use strict';

describe('Omni', function () {
  var omni = new Omni();
  beforeEach(function () {
    omni.clear();
  });

  describe('init', function () {
    it('should init all fields', function () {
      expect(omni.input).toEqual('');
      expect(omni.stripped).toEqual('');
      expect(omni.noteFrags).toEqual([]);
      expect(omni.tagFrags).toEqual([]);
    });
  });

  describe('clear', function () {
    it('should clear all fields', function () {
      omni.input = 'input tag: tag';
      omni.stripped = 'input';
      omni.noteFrags = ['input'];
      omni.tagFrags = ['tag'];

      omni.clear();
      expect(omni.input).toEqual('');
      expect(omni.stripped).toEqual('');
      expect(omni.noteFrags).toEqual([]);
      expect(omni.tagFrags).toEqual([]);
    });
  });

  describe('isClear', function () {
    beforeEach(function () {
      omni.clear();
    });

    it('should be true if all fields are empty', function () {
      expect(omni.isClear()).toBeTruthy();
    });

    it('should not be clear if input has value', function () {
      omni.input = 'input';
      expect(omni.isClear()).toBeFalsy();
    });

    it('should not be clear if stripped has value', function () {
      omni.stripped = 'input';
      expect(omni.isClear()).toBeFalsy();
    });

    it('should not be clear if tagFrags has elements', function () {
      omni.tagFrags = ['tag'];
      expect(omni.isClear()).toBeFalsy();
    });

    it('should not be clear if noteFrags has value', function () {
      omni.noteFrags = ['note'];
      expect(omni.isClear()).toBeFalsy();
    });
  });

  describe('parse', function () {
    beforeEach(function () {
      // Start with a dirty omnibox to make sure things are properly reset
      omni.input = ' User input ';
      omni.stripped = 'User input';
      omni.noteFrags = ['note frag'];
      omni.tagFrags = ['tag frag'];
    });

    it('should handle empty text', function () {
      omni.input = '';
      omni.parse();
      expect(omni.isClear()).toBeTruthy();
    });

    it('should trim text', function () {
      omni.input = '  trimmed  ';
      omni.parse();
      expect(omni.stripped).toEqual('trimmed');
      expect(omni.noteFrags).toEqual(['trimmed']);
    });

    it('should handle multiple lines', function () {
      omni.input = 'Line 1\nLine 2\n';
      omni.parse();
      expect(omni.stripped).toEqual('Line 1\nLine 2');
      expect(omni.noteFrags).toEqual(['line', '1', '2']);
      expect(omni.tagFrags).toEqual([]);
    });

    it('should parse tags on a single line', function () {
      omni.input = 'Line 1 tag: tag1, tag2';
      omni.parse();
      expect(omni.stripped).toEqual('Line 1');
      expect(omni.noteFrags).toEqual(['line', '1']);
      expect(omni.tagFrags).toEqual(['tag1', 'tag2']);
    });

    it('should parse tags at last line', function () {
      omni.input = 'Line 1\nLine 2\ntag: tag1, tag2';
      omni.parse();
      expect(omni.stripped).toEqual('Line 1\nLine 2');
      expect(omni.noteFrags).toEqual(['line', '1', '2']);
      expect(omni.tagFrags).toEqual(['tag1', 'tag2']);
    });

    it('should handle empty tags', function () {
      omni.input = 'Line 1\nLine 2\ntag: ';
      omni.parse();
      expect(omni.stripped).toEqual('Line 1\nLine 2');
      expect(omni.noteFrags).toEqual(['line', '1', '2']);
      expect(omni.tagFrags).toEqual([]);
    });

    it('should trim tags', function () {
      omni.input = 'Line 1\n  tag: tag1, tag2  \n';
      omni.parse();
      expect(omni.stripped).toEqual('Line 1');
      expect(omni.noteFrags).toEqual(['line', '1']);
      expect(omni.tagFrags).toEqual(['tag1', 'tag2']);
    });

    it('should handle multiple commas', function () {
      omni.input = 'Line 1\nLine 2\n  tag: tag1, ,, tag2 \n';
      omni.parse();
      expect(omni.stripped).toEqual('Line 1\nLine 2');
      expect(omni.noteFrags, ['line', '1', '2']);
      expect(omni.tagFrags, ['tag1', 'tag2']);
    });

    it('should leave multiple new lines intact', function () {
      omni.input = 'Line 1\n\nLine 2\n  tag: tag1, tag2 \n';
      omni.parse();
      expect(omni.stripped).toEqual('Line 1\n\nLine 2');
      expect(omni.noteFrags).toEqual(['line', '1', '2']);
      expect(omni.tagFrags, ['tag1', 'tag2']);
    });

    it('should handle tags with spaces', function () {
      omni.input = 'Line 1\nLine 2\n  tag: tag 1, tag 2  \n';
      omni.parse();
      expect(omni.stripped).toEqual('Line 1\nLine 2');
      expect(omni.noteFrags, []);
      expect(omni.tagFrags, ['tag 1', 'tag 2']);
    });

    it('should leave text intact', function () {
      var combinations = [
        'tag: tag\nLine 2',
        'Line 1\ntag: tag\nLine 3'
      ];
      for (var i = 0; i < combinations.length; i++) {
        omni.input = combinations[i];
        omni.parse();
        expect(omni.stripped).toEqual(combinations[i]);
        expect(omni.noteFrags, []);
        expect(omni.tagFrags, []);
      }
    });
  })
});

describe('sa.omnibox', function () {
  beforeEach(function () {
    module('stickyApp.services');
    module('sa.omnibox');
  });

  describe('OmniboxCtrl', function () {
    var scope;
    var notes;
    var timeout;

    beforeEach(inject(function ($rootScope, $controller, $timeout, _notes_) {
      scope = $rootScope.$new();
      timeout = $timeout;
      notes = _notes_;
      $controller('OmniboxCtrl', {$scope: scope, notes: notes});
      scope.user = {};

      // Start with a dirty omnibox to make sure things are properly reset
      scope.omni.input = 'User input';
      scope.omni.noteFrags = ['note frag'];
      scope.omni.tagFrags = ['tag frag'];
    }));

    describe('clearOmni', function () {
      it('should clear input', function () {
        expect(scope.omni.input).toBeTruthy();
        scope.clearOmni();
        expect(scope.omni.input).toEqual('');
      });
    });

    describe('createNote', function () {
      beforeEach(function () {
        scope.omni.input = '';
      });

      it('should clear omni text', function () {
        scope.omni.input = 'New Note';
        scope.$digest();
        scope.createNote();
        expect(scope.omni.input).toEqual('');
      });

      it('should init user.notes when adding a first note', function () {
        scope.omni.input = 'Note 1';
        var note = {text: 'Note 1'};
        spyOn(notes, 'createNote').andReturn(note);
        scope.$digest();
        scope.createNote();
        expect(scope.user.notes).toBeDefined();
        expect(scope.user.notes).toEqual([note]);
        expect(notes.createNote).toHaveBeenCalledWith('Note 1');
      });

      it('should append to user.notes when adding a subsequent note', function () {
        scope.omni.input = 'Note 2';
        scope.user.notes = [
          {text: 'Note 1'}
        ];
        spyOn(notes, 'createNote').andReturn({text: 'Note 2'});
        scope.$digest();
        scope.createNote();
        expect(scope.user.notes).toEqual([
          {text: 'Note 1'},
          {text: 'Note 2'}
        ]);
        expect(notes.createNote).toHaveBeenCalledWith('Note 2');
      });

      it('should have no effect when adding an empty note', function () {
        scope.user.notes = [
          {text: 'Note'}
        ];
        scope.$digest();
        scope.createNote();
        expect(scope.user.notes).toEqual([
          {text: 'Note'}
        ]);
      });

      it('should add existing tags', function () {
        scope.user.tags = [
          {name: 'tag1'},
          {name: 'tag2'}
        ];
        scope.omni.input = 'Note\ntag: tag1';
        scope.$digest();
        spyOn(notes, 'createNote').andReturn({text: 'Note'});
        scope.createNote();
        expect(notes.createNote).toHaveBeenCalledWith('Note');
        expect(scope.user.notes).toEqual([
          {text: 'Note', tags: [
            {name: 'tag1'}
          ]}
        ]);
      });
    });

    describe('updateFiltered', function () {
      function digestAndFlush() {
        scope.$digest();
        timeout.flush();
      }

      it('should match note frags', function () {
        scope.omni.input = 'foo bar';
        scope.user.notes = [
          {text: 'Foo note'},
          {text: 'Bar note'},
          {text: 'Baz note'}
        ];

        digestAndFlush();

        expect(scope.filtered.notes).toEqual([
          {text: 'Foo note'},
          {text: 'Bar note'}
        ]);
      });

      it('should match tag frags', function () {
        scope.omni.input = 'tag: x-tag, z-tag';
        scope.user.tags = [
          {name: 'x-tag'},
          {name: 'y-tag'},
          {name: 'z-tag'}
        ];
        scope.user.notes = [
          {text: 'Foo note', tags: [scope.user.tags[0]]},
          {text: 'Bar note'},
          {text: 'Baz note', tags: [scope.user.tags[1]]},
          {text: 'Qux note', tags: [scope.user.tags[2]]}
        ];

        digestAndFlush();

        var actual = [];
        angular.forEach(scope.filtered.notes, function (note) {
          actual.push(note.text);
        });

        expect(actual).toEqual(['Foo note', 'Qux note']);
      });

      it('should add note once if it matches both note and tag frags', function () {
        scope.omni.input = 'foo tag: bar';
        scope.user.tags = [
          {name: 'foobar'}
        ];
        scope.user.notes = [
          {text: 'Foo Bar', tags: [scope.user.tags[0]]}
        ];

        digestAndFlush();

        var actual = [];
        angular.forEach(scope.filtered.notes, function (note) {
          actual.push(note.text);
        });

        expect(actual).toEqual(['Foo Bar']);
      });
    });
  });
});
