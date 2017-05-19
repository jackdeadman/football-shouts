"use strict";

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var argv = require('yargs').argv; //  .usage('Usage: $0 -ios to run ios app, -android to run android app.')
var exec = require('exec-chainable');
var path = require('path');

gulp.task('lint', function () {
  var files = [
    '**/*.js',
    '!node_modules/**/*',
    '!*config.js',
    '!public/**/*'];
  return gulp.src(files)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('deploy', ['copy-jade', 'copy-public'], function () {
  if (argv.ios) {
    console.log("Deploying to ios.");
    process.chdir(path.join('..','mobile','FootballShouts'));
    exec('cordova run ios')
    .done((stdout) => {
      //console.log(stdout);
    });
  } else if (argv.android) {
    console.log("Deploying to Android.");
    process.chdir(path.join('..','mobile','FootballShouts'));
    exec('cordova run android')
    .done((stdout) => {
      console.log(stdout);
    });
  }
});

gulp.task('copy-public', () => {
  var files = [
    '../webapp/public/**/**/*',
  ];
  var outputPath = '../mobile/FootballShouts/www/';
  return gulp
    .src(files)
    .pipe(gulp.dest(outputPath));
});

gulp.task('copy-jade', () => {
  var jadeFiles = [
    '../webapp/views/index.jade'
  ];
  var outputPath = '../mobile/FootballShouts/jade';
  return gulp
    .src(jadeFiles)
    .pipe(gulp.dest(outputPath));
});
