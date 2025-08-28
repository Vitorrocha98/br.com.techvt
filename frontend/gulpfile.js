const del = require('del')
const http = require('http')
const nodeStatic = require('node-static')
const gulp = require('gulp')
const autoprefixer = require('gulp-autoprefixer')
const babel = require('gulp-babel')
const fileInclude = require('gulp-file-include')
const livereload = require('gulp-livereload')
const sass = require('gulp-sass')(require('sass'))
const sourcemaps = require('gulp-sourcemaps')
const terser = require('gulp-terser');
const through2 = require('through2');

function cleanStart() {
	return del('./www/**/*')
}

async function faviconStart() {
	gulp
		.src('./src/assets/favicon/**/*')
		.pipe(gulp.dest('./www/assets/favicon'))
		.pipe(livereload())
}

async function htmlStart() {
    gulp
        .src('./src/*.html')
        .pipe(fileInclude().on('error', (e) => { console.log('Erro gulp-file-include:\n', e.message) }))
        .pipe(injectLiveReload()) // adiciona o script automaticamente
        .pipe(gulp.dest('./www'))
        .pipe(livereload());
}


async function imageStart() {
	gulp
		.src(['./src/assets/images/**/*', '!./src/assets/images/{media-lumis,media-lumis/**}'])
		.pipe(gulp.dest('./www/assets/images'))
		.pipe(livereload())
}

async function javascriptStart() {
	gulp
		.src('./src/scripts/**/*.js')
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['@babel/preset-env']
		}))
		.pipe(terser())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./www/scripts'))
		.pipe(livereload())
}

async function sassStart() {
	gulp
		.src('./src/styles/main.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: 'compressed'
		}).on('error', sass.logError))
		.pipe(autoprefixer({
			overrideBrowserslist: ['last 2 versions']
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./www/css'))
		.pipe(livereload())
}

async function vendorStart() {
	gulp
		.src('./src/vendor/**/*.js')
		.pipe(gulp.dest('./www/vendor'))
		.pipe(livereload())
}

async function fontStart() {
	gulp
		.src('./src/assets/fonts/*')
		.pipe(gulp.dest('./www/assets/fonts'))
		.pipe(livereload())
}

async function watchStart() {
    livereload.listen({
        basePath: './www',
        quiet: false
    })

    gulp.watch('./src/assets/favicon/**/*', faviconStart)
    gulp.watch('./src/**/*.html', htmlStart)
    gulp.watch('./src/assets/images/**/*', imageStart)
    gulp.watch('./src/scripts/**/*.js', javascriptStart)
    gulp.watch('./src/styles/**/*.scss', sassStart)
    gulp.watch('./src/vendor/**/*.js', vendorStart)
    gulp.watch('./src/assets/fonts/*', fontStart)
}


async function start() {
	const project = new(nodeStatic.Server)('./www')

	http.createServer((request, response) => {
		project.serve(request, response)
	}).listen(3000)
}

function injectLiveReload() {
    return through2.obj(function (file, _, cb) {
        if (file.isBuffer()) {
            let contents = file.contents.toString();
            // Adiciona script antes de </body>
            const scriptTag = '<script src="http://localhost:35729/livereload.js"></script>';
            if (contents.includes('</body>')) {
                contents = contents.replace('</body>', `${scriptTag}\n</body>`);
            } else {
                contents += scriptTag;
            }
            file.contents = Buffer.from(contents);
        }
        cb(null, file);
    });
}

gulp.task('start', gulp.series(cleanStart, gulp.parallel(faviconStart, htmlStart, imageStart, javascriptStart, sassStart, vendorStart, fontStart), start, watchStart))