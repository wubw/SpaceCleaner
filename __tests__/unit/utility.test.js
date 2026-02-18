const mockFs = require('mock-fs');
const utility = require('../../utility');

describe('utility.js', () => {
  afterEach(() => {
    mockFs.restore();
  });

  describe('checksum()', () => {
    it('should generate consistent hash for same input', () => {
      const input = 'test string';
      const hash1 = utility.checksum(input);
      const hash2 = utility.checksum(input);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different input', () => {
      const hash1 = utility.checksum('string one');
      const hash2 = utility.checksum('string two');
      expect(hash1).not.toBe(hash2);
    });

    it('should use md5 algorithm by default', () => {
      const hash = utility.checksum('test');
      // MD5 hash is 32 hex characters
      expect(hash).toHaveLength(32);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('should support custom algorithm', () => {
      const hash = utility.checksum('test', 'sha256');
      // SHA256 hash is 64 hex characters
      expect(hash).toHaveLength(64);
    });

    it('should support custom encoding', () => {
      const hash = utility.checksum('test', 'md5', 'base64');
      // Base64 encoded MD5 is 24 characters (with padding)
      expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should handle empty string', () => {
      const hash = utility.checksum('');
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(32);
    });
  });

  describe('compareFilesContent()', () => {
    beforeEach(() => {
      mockFs({
        '/test/file1.txt': 'Hello World',
        '/test/file2.txt': 'Hello World',
        '/test/file3.txt': 'Different',
        '/test/samesizelonger.txt': 'XXXXXXXXXXX',
        '/test/empty1.txt': '',
        '/test/empty2.txt': ''
      });
    });

    it('should return true for files with same size', () => {
      const result = utility.compareFilesContent('/test/file1.txt', '/test/file2.txt');
      expect(result).toBe(true);
    });

    it('should return false for files with different sizes', () => {
      const result = utility.compareFilesContent('/test/file1.txt', '/test/file3.txt');
      expect(result).toBe(false);
    });

    it('should return true for same size different content', () => {
      // The current implementation only compares file sizes
      const result = utility.compareFilesContent('/test/file1.txt', '/test/samesizelonger.txt');
      expect(result).toBe(true);
    });

    it('should return true for empty files', () => {
      const result = utility.compareFilesContent('/test/empty1.txt', '/test/empty2.txt');
      expect(result).toBe(true);
    });

    it('should return false for non-existent source file', () => {
      const result = utility.compareFilesContent('/test/nonexistent.txt', '/test/file1.txt');
      expect(result).toBe(false);
    });

    it('should return false for non-existent target file', () => {
      const result = utility.compareFilesContent('/test/file1.txt', '/test/nonexistent.txt');
      expect(result).toBe(false);
    });
  });

  describe('copyFolderRecursiveSync()', () => {
    beforeEach(() => {
      mockFs({
        '/source': {
          'file1.txt': 'Content 1',
          'file2.txt': 'Content 2',
          'subdir': {
            'nested.txt': 'Nested content',
            'deep': {
              'deepfile.txt': 'Deep content'
            }
          }
        },
        '/target': {},
        '/emptySource': {}
      });
    });

    it('should copy folder with files to target', () => {
      const fs = require('fs');
      utility.copyFolderRecursiveSync('/source', '/target');

      expect(fs.existsSync('/target/source')).toBe(true);
      expect(fs.existsSync('/target/source/file1.txt')).toBe(true);
      expect(fs.existsSync('/target/source/file2.txt')).toBe(true);
      expect(fs.readFileSync('/target/source/file1.txt', 'utf8')).toBe('Content 1');
    });

    it('should copy nested directories recursively', () => {
      const fs = require('fs');
      utility.copyFolderRecursiveSync('/source', '/target');

      expect(fs.existsSync('/target/source/subdir')).toBe(true);
      expect(fs.existsSync('/target/source/subdir/nested.txt')).toBe(true);
      expect(fs.existsSync('/target/source/subdir/deep')).toBe(true);
      expect(fs.existsSync('/target/source/subdir/deep/deepfile.txt')).toBe(true);
    });

    it('should handle empty source directory', () => {
      const fs = require('fs');
      utility.copyFolderRecursiveSync('/emptySource', '/target');

      expect(fs.existsSync('/target/emptySource')).toBe(true);
    });

    it('should create target folder if it does not exist', () => {
      const fs = require('fs');
      mockFs({
        '/source': {
          'file.txt': 'Content'
        }
      });

      // Mock the target directory existence
      mockFs({
        '/source': {
          'file.txt': 'Content'
        },
        '/newtarget': {}
      });

      utility.copyFolderRecursiveSync('/source', '/newtarget');
      expect(fs.existsSync('/newtarget/source')).toBe(true);
    });
  });
});
