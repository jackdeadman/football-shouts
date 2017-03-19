"use strict";

var gulp = require('gulp');
var eslint = require('gulp-eslint');

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
