var fs = require('fs');
var path = require('path');
var express = require('express');
var zipFolder = require('zip-folder');
var rimraf = require("rimraf");

var app = express();
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

app.get('/', function(req, res) {
    res.sendFile('main.html', {root: __dirname})
});

var port = process.env.PORT || 3001;
var server = app.listen(port);
console.log('Express app started on port ' + port);

function readSizeRecursive(item) {
    var stats = null; 
    try {
        stats = fs.lstatSync(item);
    }
    catch(error) {
        console.log(error);
        return { path: item, size: 0, count: 0 };
    }
    var result = { path: item, size: stats.size, count: 0, isDirectory: false };

    if (stats.isDirectory()) {
        var list = fs.readdirSync(item);
        list.forEach(function(diritem) {
            var res = readSizeRecursive(path.join(item, diritem));
            result.size += res.size;
            result.count += res.count;
            result.isDirectory = true;
        });
        return result;
    }   
    else {
        result.count++;
        return result;
    }   
}

app.get('/foldersize', function(req, res) {
    var rootpath = req.query.rootpath;
    var list = fs.readdirSync(rootpath);
    var resultList = [];
    list.forEach(function(item) {
        console.log('processing path: ' + item);
        var abspath = path.join(rootpath, item)

        var result = readSizeRecursive(abspath);
        resultList.push(result);
    });
    res.write(JSON.stringify({data: resultList}));
    res.end();
});

function findemptyRecursive(item, results) {
    var stats = null;
    try {
        stats = fs.lstatSync(item);
    }
    catch(error) {
        console.log(error);
        return false;
    } 

    if (stats.isDirectory()) {
        var list = fs.readdirSync(item);
        if (list.length === 0) {
            results.push({ path: item, isDirectory: true })
            return true;
        }
        list.forEach(function(subItem) {
            findemptyRecursive(path.join(item, subItem), results);
        });
    } else {
        if(stats.size === 0) {
            results.push( { path: item, isDirectory: false });
            return true;
        }
    }
    return false;
}

app.get('/cleanempty', function(req, res) {
    console.log('start processing, please wait...');
    var rootpath = req.query.rootpath;
    var results = [];
    findemptyRecursive(rootpath, results);
    console.log('processing completes');
    res.write(JSON.stringify({data: results}));
    res.end();
});

app.post('/cleanempty', function(req, res) {
    var result = JSON.parse(req.body.data);
    result.forEach(function(elem) {
        if (elem.isDirectory) {
            fs.rmdirSync(elem.path);
        } else {
            fs.unlinkSync(elem.path);
        }
    });
});

function findrubbishRecursive(item, results) {
    var stats = null;
    try {
        stats = fs.lstatSync(item);
    }
    catch(error) {
        console.log(error);
        return;
    } 

    if (stats.isDirectory()) {
        var list = fs.readdirSync(item);
        list.forEach(function(subItem) {
            if (subItem === 'node_modules') {
                results.push({ path: path.join(item, subItem), isDirectory: true });
                return;
            }
            findrubbishRecursive(path.join(item, subItem), results);
        });
    }
}

app.get('/cleanrubbish', function(req, res) {
    console.log('start processing, please wait...');
    var rootpath = req.query.rootpath;
    var results = [];
    findrubbishRecursive(rootpath, results);
    console.log('processing completes');
    res.write(JSON.stringify({data: results}));
    res.end();
});

app.post('/cleanrubbish', function(req, res) {
    var result = JSON.parse(req.body.data);
    result.forEach(function(elem) {
        if (elem.isDirectory) {
            fs.rmdirSync(elem.path);
        } else {
            fs.unlinkSync(elem.path);
        }
    });
});

app.post('/compress', function(req, res) {
    var result = JSON.parse(req.body.data);
    result.forEach(function(elem) {
        if (elem.isDirectory) {
            console.log(elem);
            zipFolder(elem.path, elem.path + '.zip', function(err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    rimraf.sync(elem.path);
                }
            });
        }
    });
});