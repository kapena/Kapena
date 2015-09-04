// REQUIRE DEPENDENCIES
var gulp        = require('gulp'),
    gulpif      = require('gulp-if'),
    fs          = require('fs'),
    browserSync = require('browser-sync').create(),
    bower       = require('gulp-bower'),
    concat      = require('gulp-concat'),
    cssmin      = require('gulp-minify-css'),
    plumber     = require('gulp-plumber'),
    rename      = require('gulp-rename'),
    runSequence = require('run-sequence'),
    sass        = require('gulp-sass'),
    uglify      = require('gulp-uglify');

// VARIABLES ( PUT INTO JSON FILE EVENTUALLY )
function setVars(){
    // Put the global vars inside of a function so you
    // could call a refresh on them with a watch task.
    configFile   = 'config.json';
    configJSON   = JSON.parse(fs.readFileSync(configFile));
    paths = configJSON.paths;
    errorTimeout = 10000; // How long the error messages with pop up in the browser
}
setVars();

// TASKS
gulp.task('bower', function(){
    // Runs bower install so you don't have to
    return bower();
});

gulp.task('install', function(){ 
    // Installs Bower, Runs Build, and Starts Browser Sync
    
    // This is a LIFE SAVER. It runs task in sequence.
    // So it waits for one to complete before moving to the next
    // Make sure each of your tasks returns something or it won't wait
    runSequence('bower', 'default');
});


gulp.task('sync', function(){ 
    // Start Browser Sync and open Browser
    browserSync.init({
        server: {
            baseDir: paths.destination.html
        }
    });

    // Watch Files
    gulp.watch(paths.watch.js, ['scripts']);
    gulp.watch(paths.watch.styles, ['styles']);
    gulp.watch(paths.watch.html, ['reload'])
});

gulp.task('reload', function(){
    // Reload Browser
    browserSync.reload();
});

gulp.task('scripts', function(){ // Compiles and Minifies JavaScripts
    var streamError = false;
    return gulp.src(paths.source.js)
        .pipe(plumber({
            // Plumber catches errors in the stream
            // Then I use Browser Sync to notify you of them 
            // in the browser
            errorHandler: function(error) {
                streamError = error;
                this.emit('end');
            }
        }))
        .pipe(concat('app.js'))
        .pipe(gulp.dest(paths.destination.js))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.destination.js))
    	.on('end', function(){
            if(streamError){
                // If there was an error then log it to console 
                // and notify on browser
                console.log(streamError.message);
                browserSync.notify(streamError.message, errorTimeout);
            }else{
                // Reload Browser 
                browserSync.reload();
            }
        });
});

gulp.task('styles', function(){ // Compiles and Minifies Styles
    var streamError = false;
    return gulp.src(paths.source.styles)
        .pipe(plumber({
            // Plumber catches errors in the stream
            // Then I use Browser Sync to notify you of them 
            // in the browser
            errorHandler: function(error) {
                streamError = error;
                console.log(streamError.message);
                browserSync.notify(streamError.message, errorTimeout);
                this.emit('end');
            }
        }))
        .pipe(sass())
        .pipe(rename('app.css'))
        .pipe(gulp.dest(paths.destination.styles))
        .pipe(gulpif(!streamError, browserSync.reload({stream:true})))
        .pipe(cssmin())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.destination.styles))
        .pipe(gulpif(!streamError, browserSync.reload({stream:true})));        
});

gulp.task('default', function(){
    runSequence('scripts', 'styles', 'sync');
});