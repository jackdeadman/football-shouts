#!/usr/bin/env node

var execSync = require('child_process').execSync;
var fs = require('fs');

var jade_path = 'jade/'

if( !fs.existsSync(jade_path)) {
    fs.mkdirSync(jade_path)
}

execSync("jade --out www/ " + jade_path)
