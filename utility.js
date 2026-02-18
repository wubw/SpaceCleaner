const crypto = require('crypto');
const zipFolder = require('zip-folder');
const rimraf = require("rimraf");
const fs = require('fs');
const path = require('path');

function checksum(str, algorithm, encoding) {
    return crypto
      .createHash(algorithm || 'md5')
      .update(str, 'utf8')
      .digest(encoding || 'hex')
}

function compareFilesContent(srcPath, targetPath) {
    try {
        const srcstats = fs.lstatSync(srcPath);
        const tgtstats = fs.lstatSync(targetPath);
        return srcstats.size === tgtstats.size;
        /*
        var srcbuf = fs.readFileSync(srcPath);
        srccs = checksum(srcbuf);
        var tgtbuf = fs.readFileSync(targetPath);
        tgtcs = checksum(tgtbuf);
        return srccs == tgtcs;
        */
    } catch(error) {
        console.log('Error happens for following file: ' + error);
        console.log(srcPath);
        return false;
    }
}

function compressFolder(path) {
    zipFolder(path, path + '.zip', function(err) {
        if (err) {
            console.log(err);
            return;
        } else {
            rimraf.sync(path);
        }
    });
}

function copyFileSync( source, target ) {
    let targetFile = target;

    if ( fs.existsSync( target ) ) {
        if ( !fs.lstatSync( target ).isFile() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }
    try {
        fs.writeFileSync(targetFile, fs.readFileSync(source));
    } catch(error) {
        console.log(targetFile);
        console.log(error);
    }
}

function copyFolderRecursiveSync( source, target ) {
    let files = [];

    const targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        try {
            fs.mkdirSync( targetFolder );
        } catch(error) {
            console.log(targetFolder);
            console.log(error);
        }
    }

    if ( !fs.lstatSync( source ).isFile() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( !fs.lstatSync( curSource ).isFile() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}

module.exports = { checksum: checksum, 
    compressFolder: compressFolder,
    copyFolderRecursiveSync: copyFolderRecursiveSync,
    compareFilesContent: compareFilesContent };
