var gulp = require('gulp'),
    concat = require('gulp-concat'),
    clean = require('gulp-clean');

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
