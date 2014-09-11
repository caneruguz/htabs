var gulp = require('gulp');
var concat = require("gulp-concat")
var minifyCSS = require('gulp-minify-css');
var less = require('gulp-less');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

var paths = {
    cssfiles : ["./bower_components/bootstrap/dist/css/*.min.css", "./bower_components/jquery-ui/themes/ui-lightness/*.min.css", "./css/**/*.css", "./css/*.css"],
    jsfiles : [ "./bower_components/jquery/dist/*.min.js", "./bower_components/jquery-touchswipe/*.min.js", "./bower_components/jquery-ui/*.min.js", "./bower_components/jquery.scrollTo/*.min.js", "./bower_components/jquery-rescon/dist/*.min.js",  "./bower_components/bootstrap/dist/js/*.min.js", "./node_modules/mithril/mithril.js",  "./scripts/jquery_scroller.js" , "./scripts/bundle.js" ],
    less : [ "./less/*.less", "./components/**/*.less"]
}

gulp.task("less", function(){
    gulp.src(paths.less)
        .pipe(less())
        .pipe(gulp.dest('./css'));
})

gulp.task('browserify', function() {
    return browserify('./scripts/script')
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('bundle.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('./scripts'));
});

gulp.task('css', ["less"], function(){
    return gulp.src(paths.cssfiles)
        .pipe(concat('bundle.css'))
        .pipe(minifyCSS({keepBreaks:true}))
        .pipe(gulp.dest('./dist/'))
});

gulp.task('js', ['browserify'], function(){
    return gulp.src(paths.jsfiles)
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('./dist/'))
});

gulp.task('watch', function() {
    gulp.watch(paths.less, ['css']);
    gulp.watch([paths.jsfiles, './scripts/script.js', './components/**/*.js'], ['js']);
});

gulp.task("default", ["css", "js", "watch"]);