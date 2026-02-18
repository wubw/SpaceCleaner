const express = require('express');
const cleanup = require('./cleanup');
const backup = require('./backup');

const app = express();
app.use(express.static('public'));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

app.get('/', function(req, res) {
    res.sendFile('public/main.html', {root: __dirname});
});

const port = process.env.PORT || 3001;
const server = app.listen(port);
console.log('Express app started on port ' + port);

app.get('/overview', function(req, res) {
    const rootpathsplits = req.query.rootpath.split(/\r?\n/);
    const overviewList = [];
    const findings = {
        emptyList:[], duplicatesList:[],
        cleanempty: req.query.cleanempty, findreplicates:req.query.findreplicates,
        duplicatesTempResults: {}
    };
    cleanup.getoverview(overviewList, findings, rootpathsplits);
    res.write(JSON.stringify({overview: overviewList, findings:findings}));
    res.end();
});

app.post('/cleanup', function(req, res) {
    const resultlist = JSON.parse(req.body.data);
    cleanup.postcleanup(resultlist);
});

app.get('/cleanrubbish', function(req, res) {
    console.log('start processing, please wait...');
    const rootpath = req.query.rootpath;
    const results = [];
    cleanup.findrubbishRecursive(rootpath, results);
    console.log('processing completes');
    res.write(JSON.stringify({data: results}));
    res.end();
});

app.post('/cleanrubbish', function(req, res) {
    const resultlist = JSON.parse(req.body.data);
    cleanup.postcleanrubbish(resultlist);
    res.end('ok');
});

app.post('/compress', function(req, res) {
    const resultlist = JSON.parse(req.body.data);
    cleanup.postcompress(resultlist);
});

app.get('/backup', function(req, res) {
    console.log('start processing, please wait...');
    const rootpathlist = req.query.rootpath;
    const backuprootpathlist = req.query.backuprootpath;

    const srcfolders = rootpathlist.split(/\r?\n/);
    const targetfolders = backuprootpathlist.split(/\r?\n/);

    const findings = {
        onlySrc: [],
        //onlyTarget: [],
        differentContent: []
    };

    backup.getbackup(srcfolders, targetfolders, findings);

    console.log('processing completes');
    res.write(JSON.stringify({data: findings}));
    res.end();
});
