// REQUIRE DEPENDENCIES
var gulp        = require('gulp'),
    browserSync = require('browser-sync').create(),
    bower       = require('gulp-bower'),
    reload      = browserSync.reload,
    concat      = require('gulp-concat'),
    cssmin      = require('gulp-minify-css'),
    plumber     = require('gulp-plumber'),
    rename      = require('gulp-rename'),
    runSequence = require('run-sequence'),
    sass        = require('gulp-sass'),
    uglify      = require('gulp-uglify');

// VARIABLES ( PUT INTO JSON FILE EVENTUALLY )
var paths = {
    // These are your source files that will become the built files
    source: {
        styles: 'src/scss/main.scss',
        // This controls the order it is concatenated into the final app.js file
        js: [ 
            'bower_components/jquery/dist/jquery.js',
            'src/js/pages/*.js',
            'src/js/app.js'
        ]
    },
    // This is where the production code lives
    destination: {
        styles: 'www/css',
        js: 'www/js',
        html: 'www'
    },
    // This is where we are watching for changes
    watch: {
        styles: 'src/scss/*.scss',
        js:'src/js/*.js',
        html: 'www/*.html'
    }
};
// This is how long the error messages with pop up in the browser
var errorTimeout = 10000;

// TASKS
gulp.task('bower', function(){
    return bower();
});

gulp.task('install', function(){ // Installs Bower, Runs Build, and Starts Browser Sync
    // This is a LIFE SAVER. It runs task in sequence.
    // So it waits for one to complete before moving to the next
    // Make sure each of your tasks returns something or it won't wait
    runSequence('bower', 'default');
});

gulp.task('serve', function(){ // Start Browser Sync
    browserSync.init({
        server:paths.destination.html
    });
});

gulp.task('reload', function(){
    browserSync.reload();
});

gulp.task('scripts', function(){ // Compiles and Minifies JavaScripts
    return gulp.src(paths.source.js)
        .pipe(plumber({
            // Plumber catches errors in the stream
            // Then I use Browser Sync to notify you of them 
            // in the browser
            errorHandler: function(error) {
                console.log(error.message);
                browserSync.notify(error.message, errorTimeout);
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
            // This runs when task is finished
            reload();
        });
});

gulp.task('styles', function(){ // Compiles and Minifies Styles
    return gulp.src(paths.source.styles)
        .pipe(plumber({
            // Plumber catches errors in the stream
            // Then I use Browser Sync to notify you of them 
            // in the browser
            errorHandler: function(error) {
                console.log(error.message);
                browserSync.notify(error.message, errorTimeout);
                this.emit('end');
            }
        }))
        .pipe(sass())
        .pipe(rename('app.css'))
        .pipe(gulp.dest(paths.destination.styles))
        .pipe(cssmin())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.destination.styles))
        .on('end', function(){
            // This runs when task is finished
            reload({stream:true});
        });
});

gulp.task('watch',function(){ // Watches files for changes and runs tasks
    gulp.watch(paths.source.js, ['scripts']);
    gulp.watch(paths.source.scss, ['styles']);
    gulp.watch(paths.source.html, ['reload']);
});

gulp.task('default', function(){
    runSequence('scripts', 'styles', 'serve', 'watch');
});