// Import modules
require('dotenv')
	.config();
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// Paths
var syncPaths = ['public/**/*', 'views/**/*'];

/*----------- Initial run with watchers -----------*/
gulp.task('default', function () {
	console.log('Starting gulp');

	nodemon({
			script: 'blinkboard.js',
			ignore: ['package.json', 'bower.json', 'public/**.*'],
			env: {
				'NODE_ENV': 'development'
			}
		})
		.on('start', function () {
			browserSync({
				proxy: 'http://localhost:' + process.env.PORT
			});
		});

	gulp.watch(syncPaths)
		.on('change', function (event) {
			// Get filename and path
			var file = event.path.match(/[\w-]+\.scss/g);
			var path = event.path.replace(file, '');

			// If scss file, compile it and sync
			if (file !== null) {
				gulp.src(path + file)
					.pipe(sass()
						.on('error', sass.logError))
					.pipe(gulp.dest(path))
					.pipe(reload({
						stream: true
					}));
			} else {
				// Just sync
				gulp.src(event.path)
					.pipe(reload({
						stream: true
					}));
			}
		});
});
