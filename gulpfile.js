var gulp = require('gulp');
var jshint = require('gulp-jshint');
 
gulp.task('default', function () {
    return gulp.src(['**/*.js', '!node_modules/**/*'])
            .pipe(jshint({node: true}))
            .pipe(jshint.reporter());
});