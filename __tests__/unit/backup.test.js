const mockFs = require('mock-fs');
const backup = require('../../backup');
const fs = require('fs');

describe('backup.js', () => {
  afterEach(() => {
    mockFs.restore();
  });

  describe('getbackup()', () => {
    it('should detect files only in source', () => {
      mockFs({
        '/source': {
          'common.txt': 'Same content',
          'onlysrc.txt': 'Only in source'
        },
        '/target': {
          'common.txt': 'Same content'
        }
      });

      const findings = {
        onlySrc: [],
        differentContent: []
      };

      backup.getbackup(['/source'], ['/target'], findings);

      expect(findings.onlySrc).toHaveLength(1);
      expect(findings.onlySrc[0].src).toContain('onlysrc.txt');
    });

    it('should detect files with different sizes', () => {
      mockFs({
        '/source': {
          'file.txt': 'Longer source content here'
        },
        '/target': {
          'file.txt': 'Short'
        }
      });

      const findings = {
        onlySrc: [],
        differentContent: []
      };

      backup.getbackup(['/source'], ['/target'], findings);

      expect(findings.differentContent).toHaveLength(1);
      expect(findings.differentContent[0].src).toContain('file.txt');
    });

    it('should handle nested directories', () => {
      mockFs({
        '/source': {
          'subdir': {
            'file.txt': 'Content',
            'onlysrc.txt': 'Only in source'
          }
        },
        '/target': {
          'subdir': {
            'file.txt': 'Content'
          }
        }
      });

      const findings = {
        onlySrc: [],
        differentContent: []
      };

      backup.getbackup(['/source'], ['/target'], findings);

      expect(findings.onlySrc).toHaveLength(1);
      expect(findings.onlySrc[0].src).toContain('onlysrc.txt');
    });

    it('should detect directories only in source', () => {
      mockFs({
        '/source': {
          'existingdir': {
            'file.txt': 'Content'
          },
          'newdir': {
            'newfile.txt': 'New content'
          }
        },
        '/target': {
          'existingdir': {
            'file.txt': 'Content'
          }
        }
      });

      const findings = {
        onlySrc: [],
        differentContent: []
      };

      backup.getbackup(['/source'], ['/target'], findings);

      expect(findings.onlySrc).toHaveLength(1);
      expect(findings.onlySrc[0].src).toContain('newdir');
    });

    it('should handle identical folders with no differences', () => {
      mockFs({
        '/source': {
          'file1.txt': 'Content 1',
          'file2.txt': 'Content 2',
          'subdir': {
            'nested.txt': 'Nested'
          }
        },
        '/target': {
          'file1.txt': 'Content 1',
          'file2.txt': 'Content 2',
          'subdir': {
            'nested.txt': 'Nested'
          }
        }
      });

      const findings = {
        onlySrc: [],
        differentContent: []
      };

      backup.getbackup(['/source'], ['/target'], findings);

      expect(findings.onlySrc).toHaveLength(0);
      expect(findings.differentContent).toHaveLength(0);
    });

    it('should handle multiple source/target pairs', () => {
      mockFs({
        '/source1': {
          'file1.txt': 'Source 1'
        },
        '/target1': {},
        '/source2': {
          'file2.txt': 'Source 2'
        },
        '/target2': {}
      });

      const findings = {
        onlySrc: [],
        differentContent: []
      };

      backup.getbackup(['/source1', '/source2'], ['/target1', '/target2'], findings);

      expect(findings.onlySrc).toHaveLength(2);
    });

    it('should copy files only in source to target', () => {
      mockFs({
        '/source': {
          'newfile.txt': 'New content'
        },
        '/target': {}
      });

      const findings = {
        onlySrc: [],
        differentContent: []
      };

      backup.getbackup(['/source'], ['/target'], findings);

      // The function copies files asynchronously, so we check that onlySrc was populated
      expect(findings.onlySrc).toHaveLength(1);
    });

    it('should handle deeply nested structures', () => {
      mockFs({
        '/source': {
          'level1': {
            'level2': {
              'level3': {
                'deepfile.txt': 'Deep content'
              }
            }
          }
        },
        '/target': {
          'level1': {
            'level2': {
              'level3': {
                'deepfile.txt': 'Different content'
              }
            }
          }
        }
      });

      const findings = {
        onlySrc: [],
        differentContent: []
      };

      backup.getbackup(['/source'], ['/target'], findings);

      expect(findings.differentContent).toHaveLength(1);
    });

    it('should handle empty source directory', () => {
      mockFs({
        '/source': {},
        '/target': {
          'file.txt': 'Content'
        }
      });

      const findings = {
        onlySrc: [],
        differentContent: []
      };

      backup.getbackup(['/source'], ['/target'], findings);

      expect(findings.onlySrc).toHaveLength(0);
      expect(findings.differentContent).toHaveLength(0);
    });

    // Issue 4: This test documents the sync/async mismatch bug
    // getbackup uses async fs.copyFile but returns synchronously,
    // so files may not be copied when the function returns in real environments
    // (mock-fs executes callbacks synchronously, masking this issue)
    it('should have files copied to target when getbackup returns (sync completion)', () => {
      const sourceContent = 'This content should be copied';
      const differentContent = 'Updated source content';

      mockFs({
        '/source': {
          'newfile.txt': sourceContent,
          'changedfile.txt': differentContent
        },
        '/target': {
          'changedfile.txt': 'Old target content'
        }
      });

      const findings = {
        onlySrc: [],
        differentContent: []
      };

      backup.getbackup(['/source'], ['/target'], findings);

      // These assertions check that files are actually copied when getbackup returns
      // Note: mock-fs executes callbacks synchronously, so this passes in tests
      // but would fail in production where fs.copyFile is truly async

      // Check that new file was copied
      expect(fs.existsSync('/target/newfile.txt')).toBe(true);
      expect(fs.readFileSync('/target/newfile.txt', 'utf8')).toBe(sourceContent);

      // Check that changed file was updated
      expect(fs.readFileSync('/target/changedfile.txt', 'utf8')).toBe(differentContent);
    });

    // Issue 4: Verify that synchronous fs.copyFileSync is used for reliable completion
    // (Previously used async fs.copyFile which caused race conditions)
    it('should use synchronous file copy for reliable completion', () => {
      mockFs({
        '/source': {
          'file.txt': 'content'
        },
        '/target': {}
      });

      const copyFileSpy = jest.spyOn(fs, 'copyFile');
      const copyFileSyncSpy = jest.spyOn(fs, 'copyFileSync');

      const findings = {
        onlySrc: [],
        differentContent: []
      };

      backup.getbackup(['/source'], ['/target'], findings);

      // BUG: Currently fs.copyFile (async) is used instead of fs.copyFileSync
      // When the bug is fixed:
      // - copyFileSync should be called (synchronous, reliable)
      // - copyFile should NOT be called (async, unreliable completion)
      expect(copyFileSpy).not.toHaveBeenCalled();
      expect(copyFileSyncSpy).toHaveBeenCalled();

      copyFileSpy.mockRestore();
      copyFileSyncSpy.mockRestore();
    });
  });
});
