var gulp = require('gulp');
var concat = require("gulp-concat")
var minifyCSS = require('gulp-minify-css');
var less = require('gulp-less');

var paths = {
    cssfiles : ["./bower_components/bootstrap/dist/css/*.min.css", "./bower_components/jquery-ui/themes/ui-lightness/*.min.css", "./less/*.css", "./css/*.css"],
    jsfiles : [ "./bower_components/jquery/dist/*.min.js", "./bower_components/jquery-ui/*.min.js", "./bower_components/jquery.scrollTo/*.min.js", "./bower_components/bootstrap/dist/js/*.min.js", "./node_modules/mithril/*.min.js", "./scripts/shapeshifter.js", "./scripts/gridster.js", "./scripts/script.js"],
    less : "./less/*.less"
}

gulp.task("less", function(){
    gulp.src(paths.less)
        .pipe(less())
        .pipe(gulp.dest('./less'));

})

gulp.task('css', ["less"], function(){
    return gulp.src(paths.cssfiles)
        .pipe(concat('bundle.css'))
        .pipe(minifyCSS({keepBreaks:true}))
        .pipe(gulp.dest('./dist/'))
});

gulp.task('js', function(){
    return gulp.src(paths.jsfiles)
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('./dist/'))
});

gulp.task('watch', function() {
    gulp.watch(paths.less, ['css']);
    gulp.watch(paths.jsfiles, ['js']);
});

gulp.task("default", ["css", "js", "watch"]);