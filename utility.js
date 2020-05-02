var crypto = require('crypto');
var zipFolder = require('zip-folder');
var rimraf = require("rimraf");
var fs = require('fs');
var path = require('path');

function checksum(str, algorithm, encoding) {
    return crypto
      .createHash(algorithm || 'md5')
      .update(str, 'utf8')
      .digest(encoding || 'hex')
}

function compareFilesContent(srcPath, targetPath) {
    try {
        var srcstats = fs.lstatSync(srcPath);
        var tgtstats = fs.lstatSync(targetPath);
        return srcstats.size == tgtstats.size;
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

module.exports = { checksum: checksum, 
    compressFolder: compressFolder,
    copyFolderRecursiveSync: copyFolderRecursiveSync,
    compareFilesContent: compareFilesContent };
