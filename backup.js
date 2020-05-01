var utility = require('./utility');
var fs = require('fs');
var path = require('path');

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
        if (!utility.compareFilesContent(srcPath, targetPath)) {
            findings.differentContent.push({src:srcPath, tgt:targetPath});
            return;
        }
    }   
}

function getbackup(srcfolders, targetfolders, findings) {
    for(var i = 0; i < srcfolders.length; i++) {
        processCompareRecursive(srcfolders[i], targetfolders[i], findings);
    }

    findings.onlySrc.forEach(function(item) {
        stats = fs.lstatSync(item.src);
        if (stats.isDirectory()) {
            utility.copyFolderRecursiveSync(item.src, path.dirname(item.tgt));
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
}

module.exports = { getbackup: getbackup }
