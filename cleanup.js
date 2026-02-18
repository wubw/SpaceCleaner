const fs = require('fs');
const path = require('path');
const utility = require('./utility');

function processFindingRecursive(item, findings) {
    let stats = null;
    try {
        stats = fs.lstatSync(item);
    } catch(error) {
        console.log(error);
        return { path: item, size: 0, count: 0 };
    }
    const result = { path: item, size: stats.size, count: 0, isDirectory: false };

    if (!stats.isFile()) {
        const list = fs.readdirSync(item);
        if (findings !== null && findings.cleanempty && list.length === 0) {
            findings.emptyList.push({ path: item, isDirectory: true });
        }
        list.forEach(function(diritem) {
            const res = processFindingRecursive(path.join(item, diritem), findings);
            result.size += res.size;
            result.count += res.count;
            result.isDirectory = true;
        });
        return result;
    }   
    else {
        result.count++;
        const filename = path.basename(item);
        if(filename.startsWith('._') || filename === '.DS_Store' || filename.endsWith('.icloud')) {
            console.log('delete: ' + filename);
            fs.unlinkSync(item);
        }
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

function getoverview(overviewList, findings, rootpathsplits) {
    rootpathsplits.forEach(function(rootpath) {
        let list = null;
        try {
            list = fs.readdirSync(rootpath);
        } catch(error) {
            console.log(error);
            return;
        }
        list.forEach(function(item) {
            console.log('processing path: ' + item);
            const abspath = path.join(rootpath, item);

            const overview = processFindingRecursive(abspath, findings);
            overviewList.push(overview);
        });
    });

    if (findings.findreplicates) {
        for (const [key, value] of Object.entries(findings.duplicatesTempResults)) {
            if (value.length > 1) {
                const tempResults = {};
                value.forEach(function(f) {
                    let cs = null;
                    try {
                        const buf = fs.readFileSync(f);
                        cs = utility.checksum(buf);
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
}

function postcleanup(resultlist) {
    resultlist.forEach(function(elem) {
        console.log('delete: ' + elem);
        let stats = null;
        try {
            stats = fs.lstatSync(elem);
        } catch(error) {
            console.log(error);
            return;
        } 
        if (!stats.isFile()) {
            fs.rmdirSync(elem);
        } else {
            fs.unlinkSync(elem);
        }
    });
}

function findrubbishRecursive(item, results) {
    let stats = null;
    try {
        stats = fs.lstatSync(item);
    } catch(error) {
        console.log(error);
        return;
    } 

    if (!stats.isFile()) {
        const list = fs.readdirSync(item);
        list.forEach(function(subItem) {
            if (subItem === 'node_modules') {
                results.push({ path: path.join(item, subItem), isDirectory: true });
                return;
            }
            findrubbishRecursive(path.join(item, subItem), results);
        });
    }
}

function postcleanrubbish(resultlist) {
    resultlist.forEach(function(elem) {
        if (elem.isDirectory) {
            fs.rmdirSync(elem.path);
        } else {
            fs.unlinkSync(elem.path);
        }
    });
}

function postcompress(resultlist) {
    resultlist.forEach(function(elem) {
        let stats = null; 
        try {
            stats = fs.lstatSync(elem);
        } catch(error) {
            console.log(error);
            return;
        }
        if (!stats.isFile()) {
            console.log(elem);
            utility.compressFolder(elem);
        }
    });
}

module.exports = { getoverview: getoverview,
                    postcleanup: postcleanup,
                    findrubbishRecursive: findrubbishRecursive,
                    postcleanrubbish: postcleanrubbish,
                    postcompress: postcompress };
