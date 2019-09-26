var fs = require('fs');
var path = require('path');
var express = require('express');

var app = express();
app.use(express.urlencoded());
app.use(express.json());

app.get('/', function(req, res) {
    res.sendFile('main.html', {root: __dirname})
});

var port = process.env.PORT || 3001;
var server = app.listen(port);
console.log('Express app started on port ' + port);

function readSizeRecursive(item) {
    var stats = fs.lstatSync(item);
    var result = { path: item, size: stats.size, count: 0 };

    if (stats.isDirectory()) {
        var list = fs.readdirSync(item);
        list.forEach(function(diritem) {
            var res = readSizeRecursive(path.join(item, diritem));
            result.size += res.size;
            result.count += res.count;
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
        var abspath = path.join(rootpath, item)

        var result = readSizeRecursive(abspath);
        resultList.push(result);
    });
    res.write(JSON.stringify({data: resultList}));
    res.end();
});

function findemptyRecursive(item, results) {
    var stats = fs.lstatSync(item);

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

app.get('/findempty', function(req, res) {
    var rootpath = req.query.rootpath;
    var results = [];
    findemptyRecursive(rootpath, results);
    res.write(JSON.stringify({data: results}));
    res.end();
});

app.post('/findempty', function(req, res) {
    var result = JSON.parse(req.body.data);
    result.forEach(function(elem) {
        if (elem.isDirectory) {
            fs.rmdirSync(elem.path);
        } else {
            fs.unlinkSync(elem.path);
        }
    });
});
