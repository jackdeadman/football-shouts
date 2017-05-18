"use strict";

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var argv = require('yargs')
            .usage('Usage: $0 -ios to run ios app, -android to run android app.')
            .argv;
var exec = require('exec-chainable');

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
    exec('cordova run ios');
  } else if (argv.android) {
    exec('cordova run android');
  }
});

gulp.task('copy-public', () => {
  var files = [
    'webapp/public/**/**/*',
  ];
  var outputPath = 'mobile/FootballShouts/www/';
  return gulp
    .src(files)
    .dest(outputPath);
});

gulp.task('copy-jade', () => {
  var jadeFiles = [
    'webapp/views/index.jade'
  ];
  var outputPath = 'mobile/FootballShouts/jade';
  return gulp
    .src(jadeFiles)
    .dest(outputPath);
});