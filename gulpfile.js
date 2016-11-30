var gulp = require('gulp'),
    concat = require('gulp-concat'),
    clean = require('gulp-clean'),
    templateCache = require('gulp-angular-templatecache'),
    addStream = require('add-stream'),
    uglify = require('gulp-uglify'),
    pkg = require('./package.json'),
    pkg_main = 'index.js';

gulp.task('concat', [], function () {
    return gulp.src(['index.js'])
        .pipe(concat('index.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('clean', ['concat'], function () {
    gulp.src('./*.tmp', {read: false})
        .pipe(clean());
});
gulp.task('build', ['concat', 'clean']);
gulp.task('default', ['build', 'watch']);
