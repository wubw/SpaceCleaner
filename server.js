var http = require('http');
var fs = require('fs');
var path = require('path');

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

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

http.createServer(function (request, response) {
    if (request.url == '/favicon.ico') {
        return;
    }

    response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    response.write('Search: <input type="text" name="rootpath" value="C:\\Private\\DNVGL Archive" style="width:50%"><br>');
    response.write('<table style="width:100%"><tr><th>Path</th><th>Size</th><th>Count</th></tr>')
    
    var rootpath = 'C:\\Private\\DNVGL Archive';
    var list = fs.readdirSync(rootpath);
    list.forEach(function(item) {
        var abspath = path.join(rootpath, item)

        var result = readSizeRecursive(abspath);
        response.write('<tr><td>'+result.path+'</td><td>'+numberWithCommas(result.size)+'</td><td>'+result.count+'</td></tr>');
    });

    response.end('</table>\n');
}).listen(3001);

console.log('Server running at http://127.0.0.1:3001/');
