const mockFs = require('mock-fs');
const cleanup = require('../../cleanup');
const fs = require('fs');

describe('cleanup.js', () => {
  afterEach(() => {
    mockFs.restore();
  });

  describe('getoverview()', () => {
    it('should scan directory and return overview', () => {
      mockFs({
        '/root': {
          'folder1': {
            'file1.txt': 'Hello World',
            'file2.txt': 'More content'
          },
          'folder2': {
            'file3.txt': 'Content here'
          }
        }
      });

      const overviewList = [];
      const findings = {
        emptyList: [],
        duplicatesList: [],
        cleanempty: false,
        findreplicates: false,
        duplicatesTempResults: {}
      };

      cleanup.getoverview(overviewList, findings, ['/root']);

      expect(overviewList).toHaveLength(2);
      expect(overviewList.some(item => item.path.includes('folder1'))).toBe(true);
      expect(overviewList.some(item => item.path.includes('folder2'))).toBe(true);
    });

    it('should detect empty files when cleanempty is true', () => {
      mockFs({
        '/root': {
          'folder': {
            'empty.txt': '',
            'notempty.txt': 'Content'
          }
        }
      });

      const overviewList = [];
      const findings = {
        emptyList: [],
        duplicatesList: [],
        cleanempty: true,
        findreplicates: false,
        duplicatesTempResults: {}
      };

      cleanup.getoverview(overviewList, findings, ['/root']);

      expect(findings.emptyList.some(item => item.path.includes('empty.txt'))).toBe(true);
      expect(findings.emptyList.some(item => item.path.includes('notempty.txt'))).toBe(false);
    });

    it('should detect empty directories when cleanempty is true', () => {
      mockFs({
        '/root': {
          'emptydir': {},
          'notemptydir': {
            'file.txt': 'Content'
          }
        }
      });

      const overviewList = [];
      const findings = {
        emptyList: [],
        duplicatesList: [],
        cleanempty: true,
        findreplicates: false,
        duplicatesTempResults: {}
      };

      cleanup.getoverview(overviewList, findings, ['/root']);

      expect(findings.emptyList.some(item =>
        item.path.includes('emptydir') && item.isDirectory === true
      )).toBe(true);
    });

    it('should detect duplicate files by size and checksum when findreplicates is true', () => {
      mockFs({
        '/root': {
          'folder': {
            'original.txt': 'Same content here',
            'copy.txt': 'Same content here',
            'unique.txt': 'Different'
          }
        }
      });

      const overviewList = [];
      const findings = {
        emptyList: [],
        duplicatesList: [],
        cleanempty: false,
        findreplicates: true,
        duplicatesTempResults: {}
      };

      cleanup.getoverview(overviewList, findings, ['/root']);

      expect(findings.duplicatesList.length).toBeGreaterThan(0);
      expect(findings.duplicatesList[0].files.length).toBe(2);
    });

    it('should auto-delete .DS_Store files', () => {
      mockFs({
        '/root': {
          'folder': {
            '.DS_Store': 'mac junk',
            'normal.txt': 'Keep this'
          }
        }
      });

      const overviewList = [];
      const findings = {
        emptyList: [],
        duplicatesList: [],
        cleanempty: false,
        findreplicates: false,
        duplicatesTempResults: {}
      };

      cleanup.getoverview(overviewList, findings, ['/root']);

      expect(fs.existsSync('/root/folder/.DS_Store')).toBe(false);
      expect(fs.existsSync('/root/folder/normal.txt')).toBe(true);
    });

    it('should auto-delete ._ prefixed files', () => {
      mockFs({
        '/root': {
          'folder': {
            '._hidden': 'apple double',
            'normal.txt': 'Keep this'
          }
        }
      });

      const overviewList = [];
      const findings = {
        emptyList: [],
        duplicatesList: [],
        cleanempty: false,
        findreplicates: false,
        duplicatesTempResults: {}
      };

      cleanup.getoverview(overviewList, findings, ['/root']);

      expect(fs.existsSync('/root/folder/._hidden')).toBe(false);
    });

    it('should auto-delete .icloud files', () => {
      mockFs({
        '/root': {
          'folder': {
            'document.icloud': 'icloud placeholder',
            'normal.txt': 'Keep this'
          }
        }
      });

      const overviewList = [];
      const findings = {
        emptyList: [],
        duplicatesList: [],
        cleanempty: false,
        findreplicates: false,
        duplicatesTempResults: {}
      };

      cleanup.getoverview(overviewList, findings, ['/root']);

      expect(fs.existsSync('/root/folder/document.icloud')).toBe(false);
    });

    it('should handle multiple root paths', () => {
      mockFs({
        '/root1': {
          'file1.txt': 'Content 1'
        },
        '/root2': {
          'file2.txt': 'Content 2'
        }
      });

      const overviewList = [];
      const findings = {
        emptyList: [],
        duplicatesList: [],
        cleanempty: false,
        findreplicates: false,
        duplicatesTempResults: {}
      };

      cleanup.getoverview(overviewList, findings, ['/root1', '/root2']);

      expect(overviewList).toHaveLength(2);
    });

    it('should handle non-existent path gracefully', () => {
      mockFs({
        '/root': {
          'file.txt': 'Content'
        }
      });

      const overviewList = [];
      const findings = {
        emptyList: [],
        duplicatesList: [],
        cleanempty: false,
        findreplicates: false,
        duplicatesTempResults: {}
      };

      // Should not throw
      expect(() => {
        cleanup.getoverview(overviewList, findings, ['/nonexistent']);
      }).not.toThrow();
    });
  });

  describe('postcleanup()', () => {
    it('should delete files in the result list', () => {
      mockFs({
        '/test': {
          'file1.txt': 'To delete',
          'file2.txt': 'Also delete',
          'keep.txt': 'Keep this'
        }
      });

      cleanup.postcleanup(['/test/file1.txt', '/test/file2.txt']);

      expect(fs.existsSync('/test/file1.txt')).toBe(false);
      expect(fs.existsSync('/test/file2.txt')).toBe(false);
      expect(fs.existsSync('/test/keep.txt')).toBe(true);
    });

    it('should delete directories in the result list', () => {
      mockFs({
        '/test': {
          'emptydir': {},
          'keepdir': {
            'file.txt': 'Content'
          }
        }
      });

      cleanup.postcleanup(['/test/emptydir']);

      expect(fs.existsSync('/test/emptydir')).toBe(false);
      expect(fs.existsSync('/test/keepdir')).toBe(true);
    });

    it('should handle non-existent paths gracefully', () => {
      mockFs({
        '/test': {
          'file.txt': 'Content'
        }
      });

      // Should not throw
      expect(() => {
        cleanup.postcleanup(['/test/nonexistent.txt']);
      }).not.toThrow();
    });
  });

  describe('findrubbishRecursive()', () => {
    it('should find node_modules directories', () => {
      mockFs({
        '/projects': {
          'project1': {
            'index.js': 'code',
            'node_modules': {
              'lodash': {
                'index.js': 'module'
              }
            }
          }
        }
      });

      const results = [];
      cleanup.findrubbishRecursive('/projects', results);

      expect(results).toHaveLength(1);
      expect(results[0].path).toContain('node_modules');
      expect(results[0].isDirectory).toBe(true);
    });

    it('should find multiple node_modules directories', () => {
      mockFs({
        '/projects': {
          'project1': {
            'node_modules': { 'pkg': {} }
          },
          'project2': {
            'node_modules': { 'pkg': {} }
          }
        }
      });

      const results = [];
      cleanup.findrubbishRecursive('/projects', results);

      expect(results).toHaveLength(2);
    });

    it('should not recurse into node_modules', () => {
      mockFs({
        '/projects': {
          'project1': {
            'node_modules': {
              'package': {
                'node_modules': { 'nested': {} }
              }
            }
          }
        }
      });

      const results = [];
      cleanup.findrubbishRecursive('/projects', results);

      // Should only find the top-level node_modules
      expect(results).toHaveLength(1);
    });

    it('should handle paths with no node_modules', () => {
      mockFs({
        '/projects': {
          'project1': {
            'src': {
              'index.js': 'code'
            }
          }
        }
      });

      const results = [];
      cleanup.findrubbishRecursive('/projects', results);

      expect(results).toHaveLength(0);
    });

    it('should handle non-existent paths gracefully', () => {
      mockFs({});

      const results = [];
      // Should not throw
      expect(() => {
        cleanup.findrubbishRecursive('/nonexistent', results);
      }).not.toThrow();
    });
  });

  describe('postcleanrubbish()', () => {
    it('should delete directories marked in result list', () => {
      mockFs({
        '/test': {
          'node_modules': {},
          'src': {
            'index.js': 'code'
          }
        }
      });

      cleanup.postcleanrubbish([{ path: '/test/node_modules', isDirectory: true }]);

      expect(fs.existsSync('/test/node_modules')).toBe(false);
      expect(fs.existsSync('/test/src')).toBe(true);
    });

    it('should delete files marked in result list', () => {
      mockFs({
        '/test': {
          'delete.txt': 'Delete this',
          'keep.txt': 'Keep this'
        }
      });

      cleanup.postcleanrubbish([{ path: '/test/delete.txt', isDirectory: false }]);

      expect(fs.existsSync('/test/delete.txt')).toBe(false);
      expect(fs.existsSync('/test/keep.txt')).toBe(true);
    });
  });
});
