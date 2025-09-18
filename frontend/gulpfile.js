const del = require('del')
const gulp = require('gulp')
const autoprefixer = require('gulp-autoprefixer')
const babel = require('gulp-babel')
const fileInclude = require('gulp-file-include')
const livereload = require('gulp-livereload')
const sass = require('gulp-sass')(require('sass'))
const sourcemaps = require('gulp-sourcemaps')
const terser = require('gulp-terser')
const through2 = require('through2')
const http = require('http')
const nodeStatic = require('node-static')
const path = require('path')

// --------------------
// Paths
// --------------------

// Build dev local
const devPaths = {
  src: path.resolve(__dirname, 'src'),
  build: path.resolve(__dirname, 'www')
}

// Build GitHub Pages na raiz do repositório
const ghPagesPaths = {
  src: path.resolve(__dirname, 'src'),
  build: path.resolve(__dirname, '../') // sobe um nível para a raiz
}

// --------------------
// Tasks
// --------------------
function clean(buildPath) {
  if (buildPath.build === path.resolve(__dirname, '../')) {
    return del([
      path.join(buildPath.build, 'index.html'),
      path.join(buildPath.build, 'css/**/*'),
      path.join(buildPath.build, 'scripts/**/*'),
      path.join(buildPath.build, 'assets/**/*'),
      path.join(buildPath.build, 'vendor/**/*')
    ])
  }
  return del(`${buildPath.build}/**/*`)
}

function favicon(buildPath) {
  return gulp.src(`${buildPath.src}/assets/favicon/**/*`)
    .pipe(gulp.dest(`${buildPath.build}/assets/favicon`))
}

function html(buildPath, injectLivereload = false) {
  let stream = gulp.src(`${buildPath.src}/*.html`)
    .pipe(fileInclude().on('error', e => console.log('Erro gulp-file-include:\n', e.message)))

  if (injectLivereload) stream = stream.pipe(injectLiveReload())

  return stream.pipe(gulp.dest(buildPath.build))
}

function images(buildPath) {
  return gulp.src([`${buildPath.src}/assets/images/**/*`, `!${buildPath.src}/assets/images/{media-lumis,media-lumis/**}`])
    .pipe(gulp.dest(`${buildPath.build}/assets/images`))
}

function javascript(buildPath) {
  return gulp.src(`${buildPath.src}/scripts/**/*.js`)
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    .pipe(terser())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(`${buildPath.build}/scripts`))
}

function styles(buildPath) {
  return gulp.src(`${buildPath.src}/styles/main.scss`)
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 2 versions'] }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(`${buildPath.build}/css`))
}

function vendor(buildPath) {
  return gulp.src(`${buildPath.src}/vendor/**/*.js`)
    .pipe(gulp.dest(`${buildPath.build}/vendor`))
}

function fonts(buildPath) {
  return gulp.src(`${buildPath.src}/assets/fonts/*`)
    .pipe(gulp.dest(`${buildPath.build}/assets/fonts`))
}

// --------------------
// Watch & Server (dev)
// --------------------
function watch(buildPath) {
  livereload.listen({ basePath: buildPath.build, quiet: false })

  gulp.watch(`${buildPath.src}/assets/favicon/**/*`, () => favicon(buildPath))
  gulp.watch(`${buildPath.src}/**/*.html`, () => html(buildPath, true))
  gulp.watch(`${buildPath.src}/assets/images/**/*`, () => images(buildPath))
  gulp.watch(`${buildPath.src}/scripts/**/*.js`, () => javascript(buildPath))
  gulp.watch(`${buildPath.src}/styles/**/*.scss`, () => styles(buildPath))
  gulp.watch(`${buildPath.src}/vendor/**/*.js`, () => vendor(buildPath))
  gulp.watch(`${buildPath.src}/assets/fonts/*`, () => fonts(buildPath))
}

async function serve(buildPath) {
  const project = new nodeStatic.Server(buildPath.build)

  http.createServer((req, res) => {
    project.serve(req, res)
  }).listen(3000)
}

// --------------------
// LiveReload injector
// --------------------
function injectLiveReload() {
  return through2.obj(function (file, _, cb) {
    if (file.isBuffer()) {
      let contents = file.contents.toString()
      const scriptTag = '<script src="http://localhost:35729/livereload.js"></script>'
      if (contents.includes('</body>')) {
        contents = contents.replace('</body>', `${scriptTag}\n</body>`)
      } else {
        contents += scriptTag
      }
      file.contents = Buffer.from(contents)
    }
    cb(null, file)
  })
}

// --------------------
// Build Dev (start)
// --------------------
gulp.task('start', gulp.series(
  () => clean(devPaths.build),
  gulp.parallel(
    () => favicon(devPaths),
    () => html(devPaths, true),
    () => images(devPaths),
    () => javascript(devPaths),
    () => styles(devPaths),
    () => vendor(devPaths),
    () => fonts(devPaths)
  ),
  gulp.parallel(
    () => serve(devPaths),
    () => watch(devPaths)
  )
))

// --------------------
// Build GitHub Pages
// --------------------
gulp.task('build-github-pages', gulp.series(
  () => clean(ghPagesPaths),
  gulp.parallel(
    () => favicon(ghPagesPaths),
    () => html(ghPagesPaths, false),
    () => images(ghPagesPaths),
    () => javascript(ghPagesPaths),
    () => styles(ghPagesPaths),
    () => vendor(ghPagesPaths),
    () => fonts(ghPagesPaths)
  )
))
