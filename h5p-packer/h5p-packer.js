#!/usr/bin/env node

var exec = require('child_process').exec;
var fs = require('fs');

// Read JSON config:
var config = require(__dirname + '/h5ps.json');

// Utility function for deleting a folder
var deleteFolderRecursive = function(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

// TODO - should create a real temp-directory
var packDir = '/tmp/h5p-packing';

// Function that packs all libs in H5P
var createH5P = function () {
  var cmd = 'cd ' + packDir + ';h5p pack ';
  for (var i in config.h5ps) {
    cmd += config.h5ps[i].name + '-' + config.h5ps[i].branch + ' ';
  }
  
  exec(cmd, function (error, stdout, stderr) {
    if (error) {
      console.log('Failed building H5P :' + error + ' - ' + stderr);
    }
    else {
      console.log('Finished building H5P containing ' + config.h5ps.length + ' libraries: /tmp/h5p-packing/libraries.h5p');
    }
  });
}

// Create tmp directory
deleteFolderRecursive(packDir);
fs.mkdirSync(packDir);

var numClonedLibs = 0;

// Iterate over H5Ps:
for (var i in config.h5ps) {
  var lib = config.h5ps[i];
  
  // Git clone
  var cmd = 'cd ' + packDir + ';git clone git@github.com:h5p/' + lib.name + ' ' + lib.name + '-' + lib.branch + ' --branch ' + lib.branch + ' --single-branch';
  
  console.log('Cloning ' + lib.name + ' [' + lib.branch + ']');
  
  exec(cmd, function (error, stdout, stderr) {
    if (error) {
      console.log('Failed :' + error);
      process.exit(1);
    }
    
    numClonedLibs++;
    if (numClonedLibs === config.h5ps.length) {
      createH5P();
    }
  });
}
