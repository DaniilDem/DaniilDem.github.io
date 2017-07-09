const gulp = require('gulp'),
    less = require('gulp-less'),
    livereload = require('gulp-livereload'),
    prefix = require('gulp-autoprefixer'),
    sourcemaps = require('gulp-sourcemaps'),
    cssnano = require('gulp-cssnano'),
    uglify = require('uglify-es'),
    concat = require('gulp-concat'),
    webpack = require('webpack-stream'),
    gulpif = require('gulp-if'),
    path = require('path'),
    swPrecache = require('sw-precache');



const appName = 'Daniil.me';
const cssMinName = 'build.min.css';
const jsMinName = 'build.min.js';

const pathRoot = './';
const pathLess = pathRoot+'src/less/';
const pathCss = pathRoot+'dist/css/';
const pathJs = pathRoot+'src/js/';
const pathJsDist = pathRoot+'dist/js/';
const pathHtml = pathRoot;

var release = false;

gulp.task('html', function ()
{
    return gulp.src(pathHtml+'*.html')
        .pipe(livereload());
});


gulp.task('generate-service-worker', callback => {
    swPrecache.write(path.join(pathRoot, 'sw.js'), {
        staticFileGlobs: [
            // track and cache all files that match this pattern
            pathRoot + '/**/*.{js,html,css,png,jpg,gif}',
        ],
        stripPrefix: pathRoot
    }, callback);
});

gulp.task('less', function ()
{
    gulp.src([pathLess+'common.less'])
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(gulpif(release, cssnano()))
        .pipe(prefix('last 4 versions'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(pathCss))
       .pipe(livereload());
});


gulp.task('css', function ()
{
    gulp.src([pathCss+"*.css"])
    //     .pipe(gulpif(!release, sourcemaps.init()))
    //     .pipe(concat(cssMinName))
    //     .pipe(gulpif(release, cssnano()))
    //     .pipe(gulpif(!release, sourcemaps.write('.')))
    //     .pipe(gulp.dest(pathCss))
        .pipe(livereload());
});


gulp.task('js', function ()
{
    return gulp.src([pathJs+'**/*.js'])
        .pipe(concat(jsMinName))
        // .pipe(gulpif(release, uglify()))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(pathJsDist))
        .pipe(livereload());

    // return gulp.src(pathJs+'*.js')
    //     .pipe(livereload());

});

gulp.task('watch', function ()
{
    livereload.listen();
    gulp.watch(pathLess+'**/*.less', ['less']);
    gulp.watch([pathCss+'*.css', '!'+pathCss+cssMinName], ['css']);
    gulp.watch([pathHtml+"*.html"], ['html']);
    gulp.watch([pathJs+'**/*.js', '!'+pathJs+jsMinName], ['js']);

});


gulp.task('setRelease', function ()
{
    release = true;
    console.log('release: '+release);
});

gulp.task('default', ['build', 'watch']);
gulp.task('build', ['css', 'js']);
gulp.task('release', ['setRelease', 'build']);


