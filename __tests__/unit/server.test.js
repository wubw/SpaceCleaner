const request = require('supertest');
const express = require('express');
const mockFs = require('mock-fs');

// We need to mock the modules before requiring server
// Create a mock server for testing
function createTestApp() {
  const cleanup = require('../../cleanup');
  const backup = require('../../backup');

  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.get('/overview', function (req, res) {
    var rootpathsplits = req.query.rootpath.split(/\r?\n/);
    var overviewList = [];
    var findings = {
      emptyList: [],
      duplicatesList: [],
      cleanempty: req.query.cleanempty,
      findreplicates: req.query.findreplicates,
      duplicatesTempResults: {}
    };
    cleanup.getoverview(overviewList, findings, rootpathsplits);
    res.write(JSON.stringify({ overview: overviewList, findings: findings }));
    res.end();
  });

  app.post('/cleanup', function (req, res) {
    try {
      var resultlist = JSON.parse(req.body.data);
      cleanup.postcleanup(resultlist);
      res.end('ok');
    } catch (err) {
      res.status(500).end('error: ' + err.message);
    }
  });

  app.get('/cleanrubbish', function (req, res) {
    var rootpath = req.query.rootpath;
    var results = [];
    cleanup.findrubbishRecursive(rootpath, results);
    res.write(JSON.stringify({ data: results }));
    res.end();
  });

  app.post('/cleanrubbish', function (req, res) {
    try {
      var resultlist = JSON.parse(req.body.data);
      cleanup.postcleanrubbish(resultlist);
      res.end('ok');
    } catch (err) {
      res.status(500).end('error: ' + err.message);
    }
  });

  app.get('/backup', function (req, res) {
    var rootpathlist = req.query.rootpath;
    var backuprootpathlist = req.query.backuprootpath;

    var srcfolders = rootpathlist.split(/\r?\n/);
    var targetfolders = backuprootpathlist.split(/\r?\n/);

    var findings = {
      onlySrc: [],
      differentContent: []
    };

    backup.getbackup(srcfolders, targetfolders, findings);
    res.write(JSON.stringify({ data: findings }));
    res.end();
  });

  return app;
}

describe('server.js routes', () => {
  let app;

  beforeEach(() => {
    // Reset module cache to get fresh instances
    jest.resetModules();
    app = createTestApp();
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe('GET /overview', () => {
    it('should return findings JSON', async () => {
      mockFs({
        '/testroot': {
          'folder1': {
            'file1.txt': 'Hello World'
          }
        }
      });

      const response = await request(app)
        .get('/overview')
        .query({
          rootpath: '/testroot',
          cleanempty: 'false',
          findreplicates: 'false'
        });

      expect(response.status).toBe(200);
      const body = JSON.parse(response.text);
      expect(body).toHaveProperty('overview');
      expect(body).toHaveProperty('findings');
      expect(Array.isArray(body.overview)).toBe(true);
    });

    it('should detect empty files when cleanempty is true', async () => {
      mockFs({
        '/testroot': {
          'folder': {
            'empty.txt': ''
          }
        }
      });

      const response = await request(app)
        .get('/overview')
        .query({
          rootpath: '/testroot',
          cleanempty: 'true',
          findreplicates: 'false'
        });

      const body = JSON.parse(response.text);
      expect(body.findings.emptyList.length).toBeGreaterThan(0);
    });

    it('should handle multiple root paths', async () => {
      mockFs({
        '/root1': {
          'file1.txt': 'Content 1'
        },
        '/root2': {
          'file2.txt': 'Content 2'
        }
      });

      const response = await request(app)
        .get('/overview')
        .query({
          rootpath: '/root1\n/root2',
          cleanempty: 'false',
          findreplicates: 'false'
        });

      const body = JSON.parse(response.text);
      expect(body.overview).toHaveLength(2);
    });
  });

  describe('POST /cleanup', () => {
    it('should accept cleanup requests and call postcleanup', async () => {
      // Test with empty array to avoid needing real files
      // The actual deletion logic is tested in cleanup.test.js
      const response = await request(app)
        .post('/cleanup')
        .send({ data: JSON.stringify([]) });

      expect(response.status).toBe(200);
      expect(response.text).toBe('ok');
    });
  });

  describe('GET /cleanrubbish', () => {
    it('should return node_modules list', async () => {
      mockFs({
        '/projects': {
          'project1': {
            'index.js': 'code',
            'node_modules': {
              'lodash': {}
            }
          }
        }
      });

      const response = await request(app)
        .get('/cleanrubbish')
        .query({ rootpath: '/projects' });

      expect(response.status).toBe(200);
      const body = JSON.parse(response.text);
      expect(body).toHaveProperty('data');
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0].path).toContain('node_modules');
    });

    it('should return empty list when no node_modules found', async () => {
      mockFs({
        '/projects': {
          'project1': {
            'src': {
              'index.js': 'code'
            }
          }
        }
      });

      const response = await request(app)
        .get('/cleanrubbish')
        .query({ rootpath: '/projects' });

      const body = JSON.parse(response.text);
      expect(body.data).toHaveLength(0);
    });
  });

  describe('POST /cleanrubbish', () => {
    it('should accept cleanrubbish requests and call postcleanrubbish', async () => {
      // Test with empty array to avoid needing real files
      // The actual deletion logic is tested in cleanup.test.js
      const response = await request(app)
        .post('/cleanrubbish')
        .send({ data: JSON.stringify([]) });

      expect(response.status).toBe(200);
      expect(response.text).toBe('ok');
    });
  });

  describe('GET /backup', () => {
    it('should return sync findings', async () => {
      mockFs({
        '/source': {
          'file1.txt': 'Source content',
          'newfile.txt': 'Only in source'
        },
        '/target': {
          'file1.txt': 'Different content'
        }
      });

      const response = await request(app)
        .get('/backup')
        .query({
          rootpath: '/source',
          backuprootpath: '/target'
        });

      expect(response.status).toBe(200);
      const body = JSON.parse(response.text);
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('onlySrc');
      expect(body.data).toHaveProperty('differentContent');
    });

    it('should detect files only in source', async () => {
      mockFs({
        '/source': {
          'onlysrc.txt': 'Only in source'
        },
        '/target': {}
      });

      const response = await request(app)
        .get('/backup')
        .query({
          rootpath: '/source',
          backuprootpath: '/target'
        });

      const body = JSON.parse(response.text);
      expect(body.data.onlySrc.length).toBeGreaterThan(0);
    });

    it('should detect files with different content', async () => {
      mockFs({
        '/source': {
          'file.txt': 'Source content that is longer'
        },
        '/target': {
          'file.txt': 'Short'
        }
      });

      const response = await request(app)
        .get('/backup')
        .query({
          rootpath: '/source',
          backuprootpath: '/target'
        });

      const body = JSON.parse(response.text);
      expect(body.data.differentContent.length).toBeGreaterThan(0);
    });

    it('should handle identical source and target', async () => {
      mockFs({
        '/source': {
          'file.txt': 'Same content'
        },
        '/target': {
          'file.txt': 'Same content'
        }
      });

      const response = await request(app)
        .get('/backup')
        .query({
          rootpath: '/source',
          backuprootpath: '/target'
        });

      const body = JSON.parse(response.text);
      expect(body.data.onlySrc).toHaveLength(0);
      expect(body.data.differentContent).toHaveLength(0);
    });
  });
});
