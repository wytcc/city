var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    rename = require('gulp-rename'),
    notify = require('gulp-notify'),
    webpack = require("webpack"),
    gulpWebpack = require("webpack-stream"),
    path = require("path"),
    gutil = require("gulp-util"),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload,
    zip = require('gulp-zip'),
    uglify = require('gulp-uglify'),
    clean = require('gulp-clean'),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector');

gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: "./",
            index: "index.html"
        },
        port: 3010
    });
});

gulp.task('clean', function () {
    gulp.src(['./build', './.sass-cache'])
        .pipe(clean({force: true}));
});

gulp.task('build', ['styles', 'webpack', 'clean'], function () {
    gulp.src('static/css/**/*.css')
        .pipe(gulp.dest('build/static/css'));
    gulp.src('static/js/dist/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('build/static/js/dist'));
    gulp.src('./*.html')
        .pipe(gulp.dest('build'));
    gulp.src('WEB-INF/web.xml')
        .pipe(gulp.dest('build/WEB-INF'));
    gulp.src('static/images/**/*')
        .pipe(gulp.dest('build/static/images'));
    gulp.src('static/views/**/*')
        .pipe(gulp.dest('build/static/views'));
    gulp.src('static/data/**/*')
        .pipe(gulp.dest('build/static/data'));
    gulp.src('static/fonts/**/*')
        .pipe(gulp.dest('build/static/fonts'));
});

gulp.task('zip', function () {
    gulp.src('./build/**')
        .pipe(zip('topoVis.zip'))
        .pipe(gulp.dest('./'));
});

gulp.task('styles', function () {
    return sass('static/sass/main.scss', {style: 'compressed'})
        .pipe(autoprefixer('last 3 version'))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('static/css'))
        .pipe(reload({stream: true}));
});

gulp.task('webpack', function () {
    return gulp.src('static/js/src/entry.js')
        .pipe(gulpWebpack({
            plugins: [
                new webpack.optimize.CommonsChunkPlugin('common.js')
            ],
            entry: {
                "index": "./static/js/src/index/index.js",
                "timeline": "./static/js/src/timeline/timeline.js",
                "earthquake": "./static/js/src/earthquake/earthquake.js"
            },
            output: {
                filename: "[name].js",
                publicPath: "./dist/"
            },
            resolve: {
                extensions: ['.js', ""],
                alias: {
                    util: path.join(__dirname, "./static/js/util/util.js"),
                    nodes: path.join(__dirname, "./static/js/src/index/nodes.js"),
                    nodesProducer: path.join(__dirname, "./static/js/src/index/nodesProducer.js"),
                    linksProducer: path.join(__dirname, "./static/js/src/index/linksProducer.js"),
                    coordinates: path.join(__dirname, "./static/js/src/index/coordinates.js"),
                    pixelmap: path.join(__dirname, "./static/js/src/index/pixelmap.js"),
                    sankey: path.join(__dirname, "./static/js/src/index/sankey.js"),
                    leafletmap: path.join(__dirname, "./static/js/src/index/leafletmap.js")
                }
            },
            devtool: "sourcemap"
        }, null, function (err, stats) {
            if (err) throw new gutil.PluginError("webpack", err);
            gutil.log("[webpack]", stats.toString({}));
        }, webpack))
        .pipe(gulp.dest('static/js/dist/'))
        .pipe(reload({stream: true}));
});

//监听
gulp.task('watch', function () {
    gulp.watch('static/sass/**/*.scss', ['styles']);
    gulp.watch('static/js/**/*.js', ['webpack']);
    gulp.watch("**/*.html").on('change', reload);
});

gulp.task('default', ['watch'], function () {
    gulp.start('browser-sync');
    gulp.start('styles');
    gulp.start('webpack');
    gulp.start('watch');
});

