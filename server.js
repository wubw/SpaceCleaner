var express = require('express');
var cleanup = require('./cleanup');
var backup = require('./backup');

var app = express();
app.use(express.static('public'));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

app.get('/', function(req, res) {
    res.sendFile('public/main.html', {root: __dirname});
});

var port = process.env.PORT || 3001;
var server = app.listen(port);
console.log('Express app started on port ' + port);

app.get('/overview', function(req, res) {
    var rootpathsplits = req.query.rootpath.split(/\r?\n/);
    var overviewList = [];
    var findings = { 
        emptyList:[], duplicatesList:[], 
        cleanempty: req.query.cleanempty, findreplicates:req.query.findreplicates,
        duplicatesTempResults: {}
    };
    cleanup.getoverview(overviewList, findings, rootpathsplits);
    res.write(JSON.stringify({overview: overviewList, findings:findings}));
    res.end();
});

app.post('/cleanup', function(req, res) {
    var resultlist = JSON.parse(req.body.data);
    cleanup.postcleanup(resultlist);
});

app.get('/cleanrubbish', function(req, res) {
    console.log('start processing, please wait...');
    var rootpath = req.query.rootpath;
    var results = [];
    cleanup.findrubbishRecursive(rootpath, results);
    console.log('processing completes');
    res.write(JSON.stringify({data: results}));
    res.end();
});

app.post('/cleanrubbish', function(req, res) {
    var resultlist = JSON.parse(req.body.data);
    cleanup.postcleanrubbish(resultlist);
    res.end('ok');
});

app.post('/compress', function(req, res) {
    var resultlist = JSON.parse(req.body.data);
    cleanup.postcompress(resultlist);
});

app.get('/backup', function(req, res) {
    console.log('start processing, please wait...');
    var rootpathlist = req.query.rootpath;
    var backuprootpathlist = req.query.backuprootpath;

    var srcfolders = rootpathlist.split(/\r?\n/);
    var targetfolders = backuprootpathlist.split(/\r?\n/);

    var findings = {
        onlySrc: [],
        //onlyTarget: [],
        differentContent: []
    }

    backup.getbackup(srcfolders, targetfolders, findings);

    console.log('processing completes');
    res.write(JSON.stringify({data: findings}));
    res.end();
});
