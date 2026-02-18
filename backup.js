const utility = require('./utility');
const fs = require('fs');
const path = require('path');

function processCompareRecursive(srcPath, targetPath, findings) {
    let stats = null;
    try {
        stats = fs.lstatSync(srcPath);
    } catch(error) {
        console.log(error);
        return;
    }

    if (!stats.isFile()) {
        const srcList = fs.readdirSync(srcPath);
        srcList.forEach(function(diritem) {
            const targetdiritemfullpath = path.join(targetPath, diritem);
            const srcfullpath = path.join(srcPath, diritem);
            if (fs.existsSync(targetdiritemfullpath)) {
                processCompareRecursive(srcfullpath, targetdiritemfullpath, findings);
            } else {
                findings.onlySrc.push({src:srcfullpath, tgt:targetdiritemfullpath});
                return;
            }
        });
    } else {
        let targetStats = null;
        try {
            targetStats = fs.lstatSync(targetPath);
        } catch(error) {
            console.log(error);
            return;
        }
        if (stats.size !== targetStats.size) {
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
    for (let i = 0; i < srcfolders.length; i++) {
        processCompareRecursive(srcfolders[i], targetfolders[i], findings);
    }

    findings.onlySrc.forEach(function(item) {
        const stats = fs.lstatSync(item.src);
        console.log(item.src);
        if (!stats.isFile()) {
            if (item.src.indexOf('.epub/') > -1) {
                console.log(item.src);
                return;
            }
                utility.copyFolderRecursiveSync(item.src, path.dirname(item.tgt));
        } else {
            try {
                fs.copyFileSync(item.src, item.tgt);
            } catch (err) {
                console.log(err);
            }
        }
    });
    findings.differentContent.forEach(function(item) {
        if (item.src.endsWith('Microsoft.url')) {
            return;
        }
        console.log(item.src);
        try {
            fs.copyFileSync(item.src, item.tgt);
        } catch (err) {
            console.log(err);
        }
    });
}

module.exports = { getbackup: getbackup }
