var fs = require('fs');
var path = require('path');
var express = require('express');
var zipFolder = require('zip-folder');
var rimraf = require("rimraf");
var crypto = require('crypto');

var app = express();
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

app.get('/', function(req, res) {
    res.sendFile('main.html', {root: __dirname})
});

var port = process.env.PORT || 3001;
var server = app.listen(port);
console.log('Express app started on port ' + port);

function checksum(str, algorithm, encoding) {
    return crypto
      .createHash(algorithm || 'md5')
      .update(str, 'utf8')
      .digest(encoding || 'hex')
}

function processFindingRecursive(item, findings) {
    var stats = null; 
    try {
        stats = fs.lstatSync(item);
    } catch(error) {
        console.log(error);
        return { path: item, size: 0, count: 0 };
    }
    var result = { path: item, size: stats.size, count: 0, isDirectory: false };

    if (stats.isDirectory()) {
        var list = fs.readdirSync(item);
        if (findings !== null && findings.cleanempty && list.length === 0) {
            findings.emptyList.push({ path: item, isDirectory: true });
        }
        list.forEach(function(diritem) {
            var res = processFindingRecursive(path.join(item, diritem), findings);
            result.size += res.size;
            result.count += res.count;
            result.isDirectory = true;
        });
        return result;
    }   
    else {
        result.count++;
        if(findings !== null && findings.cleanempty && stats.size === 0) {
            findings.emptyList.push( { path: item, isDirectory: false });
        }
        if(findings !== null && findings.findreplicates) {
            if (stats.size in findings.duplicatesTempResults) {
                findings.duplicatesTempResults[stats.size].push(item);
            } else {
                findings.duplicatesTempResults[stats.size] = [item];
            }
        }
        return result;
    }   
}

app.get('/overview', function(req, res) {
    var rootpathsplits = req.query.rootpath.split(/\r?\n/);
    var overviewList = [];
    var findings = { 
        emptyList:[], duplicatesList:[], 
        cleanempty: req.query.cleanempty, findreplicates:req.query.findreplicates,
        duplicatesTempResults: {}
    };
    rootpathsplits.forEach(function(rootpath) {
        var list = null; 
        try {
            list = fs.readdirSync(rootpath);
        } catch(error) {
            console.log(error);
            return;
        }
        list.forEach(function(item) {
            console.log('processing path: ' + item);
            var abspath = path.join(rootpath, item)
    
            var overview = processFindingRecursive(abspath, findings);
            overviewList.push(overview);
        });
    });

    if (findings.findreplicates) {
        for (const [key, value] of Object.entries(findings.duplicatesTempResults)) {
            if (value.length > 1) {
                var tempResults = {};
                value.forEach(function(f) {
                    var cs = null;
                    try {
                        var buf = fs.readFileSync(f);
                        cs = checksum(buf);
                    } catch(error) {
                        console.log('Error happens for following file: ' + error);
                        console.log(f);
                        return;
                    }
    
                    if (cs in tempResults) {
                        tempResults[cs].push(f);
                    } else {
                        tempResults[cs] = [f];
                    }
                });
                for (const [k, v] of Object.entries(tempResults)) {
                    if (v.length > 1) {
                        findings.duplicatesList.push({ filesize: key, files: v} );
                    }
                }
            }
        }
    }
    findings.duplicatesTempResults = {};
    res.write(JSON.stringify({overview: overviewList, findings:findings}));
    res.end();
});

app.post('/cleanup', function(req, res) {
    var result = JSON.parse(req.body.data);
    result.forEach(function(elem) {
        console.log('delete: ' + elem);
        var stats = null;
        try {
            stats = fs.lstatSync(elem);
        } catch(error) {
            console.log(error);
            return;
        } 
        if (stats.isDirectory()) {
            fs.rmdirSync(elem);
        } else {
            fs.unlinkSync(elem);
        }
    });
});

app.get('/overview', function(req, res) {
    var rootpathsplits = req.query.rootpath.split(/\r?\n/);
    var backuprootpathsplits = req.query.backuprootpath.split(/\r?\n/);
    if (rootpathsplits.length !== backuprootpathsplits.length) {
        console.log('The number of folders are different.');
        return;
    }
});

function findrubbishRecursive(item, results) {
    var stats = null;
    try {
        stats = fs.lstatSync(item);
    } catch(error) {
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
    res.end('ok');
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

function processCompareRecursive(srcPath, targetPath, findings) {
    var stats = null; 
    try {
        stats = fs.lstatSync(srcPath);
    } catch(error) {
        console.log(error);
        return;
    }

    if (stats.isDirectory()) {
        var srcList = fs.readdirSync(srcPath);
        srcList.forEach(function(diritem) {
            var targetdiritemfullpath = path.join(targetPath, diritem);
            var srcfullpath = path.join(srcPath, diritem);
            if (fs.existsSync(targetdiritemfullpath)) {
                processCompareRecursive(srcfullpath, targetdiritemfullpath, findings);
            } else {
                findings.onlySrc.push({src:srcfullpath, tgt:targetdiritemfullpath});
                return;
            }
        });
    } else {
        var targetStats = null;
        try {
            targetStats = fs.lstatSync(targetPath);
        } catch(error) {
            console.log(error);
            return;
        }
        if (stats.size != targetStats.size) {
            findings.differentContent.push({src:srcPath, tgt:targetPath});
            return;
        }
        var srcbuf = fs.readFileSync(srcPath);
        srccs = checksum(srcbuf);
        var tgtbuf = fs.readFileSync(targetPath);
        tgtcs = checksum(tgtbuf);
        if (srccs != tgtcs) {
            findings.differentContent.push({src:srcPath, tgt:targetPath});
            return;
        }
    }   
}

function copyFileSync( source, target ) {
    var targetFile = target;

    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, target ) {
    var files = [];

    var targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}

app.get('/compare', function(req, res) {
    console.log('start processing, please wait...');
    var rootpathlist = req.query.rootpath;
    var backuprootpathlist = req.query.backuprootpath;

    var srcfolders = rootpathlist.split(/\r?\n/);
    var targetfolders = backuprootpathlist.split(/\r?\n/);
    console.log(srcfolders);
    console.log(targetfolders);

    var findings = {
        onlySrc: [],
        //onlyTarget: [],
        differentContent: []
    }

    for(var i = 0; i < srcfolders.length; i++) {
        processCompareRecursive(srcfolders[i], targetfolders[i], findings);
    }

    findings.onlySrc.forEach(function(item) {
        stats = fs.lstatSync(item.src);
        if (stats.isDirectory()) {
            copyFolderRecursiveSync(item.src, path.dirname(item.tgt));
        } else {
            fs.copyFile(item.src, item.tgt, (err) => {
                if (err) console.log(err);
              });
        }
    });
    findings.differentContent.forEach(function(item) {
        fs.copyFile(item.src, item.tgt, (err) => {
            if (err) console.log(err);
          });
    });

    console.log('processing completes');
    res.write(JSON.stringify({data: findings}));
    res.end();
});
