/**
 * Shared mock file system configurations for testing
 */

const basicFileSystem = {
  '/test/source': {
    'file1.txt': 'Hello World',
    'file2.txt': 'Different content here',
    'empty.txt': '',
    'subdir': {
      'nested.txt': 'Nested file content'
    }
  },
  '/test/target': {
    'file1.txt': 'Hello World',
    'file2.txt': 'Modified content'
  },
  '/test/empty-dir': {}
};

const duplicateFileSystem = {
  '/test/duplicates': {
    'original.txt': 'Same content',
    'copy1.txt': 'Same content',
    'copy2.txt': 'Same content',
    'unique.txt': 'Different content'
  }
};

const cleanupFileSystem = {
  '/test/cleanup': {
    '.DS_Store': 'mac junk',
    '._hidden': 'apple double file',
    'document.icloud': 'icloud placeholder',
    'normal.txt': 'Keep this file',
    'emptydir': {},
    'subdir': {
      'file.txt': 'Content',
      'emptysubdir': {}
    }
  }
};

const nodeModulesFileSystem = {
  '/test/projects': {
    'project1': {
      'index.js': 'console.log("hello")',
      'node_modules': {
        'lodash': {
          'index.js': 'module.exports = {}'
        }
      }
    },
    'project2': {
      'app.js': 'console.log("app")',
      'node_modules': {
        'express': {
          'index.js': 'module.exports = {}'
        }
      }
    }
  }
};

const backupFileSystem = {
  '/source': {
    'file1.txt': 'Source content',
    'file2.txt': 'Same in both',
    'newfile.txt': 'Only in source',
    'subdir': {
      'nested.txt': 'Nested content',
      'onlysrc.txt': 'Only in source subdir'
    }
  },
  '/target': {
    'file1.txt': 'Different content',
    'file2.txt': 'Same in both',
    'subdir': {
      'nested.txt': 'Nested content'
    }
  }
};

module.exports = {
  basicFileSystem,
  duplicateFileSystem,
  cleanupFileSystem,
  nodeModulesFileSystem,
  backupFileSystem
};
