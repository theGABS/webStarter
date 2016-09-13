//*********** IMPORTS *****************
const gulp = require('gulp');
const sass = require('gulp-ruby-sass');
const map = require("map-stream");
const livereload = require("gulp-livereload");
const concat = require("gulp-concat");
const uglify = require('gulp-uglify');
const watch = require('gulp-watch');
const autoprefixer = require('gulp-autoprefixer');
const fileinclude = require('gulp-file-include');
const spritesmith = require('gulp.spritesmith');
const sourcemaps = require('gulp-sourcemaps');
const order = require("gulp-order");
const lr = require('tiny-lr');  
const imagemin = require('gulp-imagemin');
const del = require('del');

const server = lr();

const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const watchify = require('watchify');
const babel = require('babelify');

const jade = require('gulp-jade');



const distFolder = 'dist/';
const srcFolder = 'src/';

const scsslint = require('gulp-scss-lint');
const eslint = require('gulp-eslint');

function compileJS(watch) {
  var bundler = watchify(browserify(srcFolder + '/js/index.js', { debug: true }).transform(babel, {"presets": ["es2015"]}));

  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('build.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(distFolder + 'js'));
  }

  if (watch) {
    bundler.on('update', function() {
      console.log('-> bundling...');
      rebundle();
    });
  }

  rebundle();
}



gulp.task('js', function() { return compileJS(); });


 
gulp.task('es-lint', () => {
    // ESLint ignores files with "node_modules" paths. 
    // So, it's best to have gulp ignore the directory as well. 
    // Also, Be sure to return the stream from the task; 
    // Otherwise, the task may end before the stream has finished. 
    return gulp.src([srcFolder + '**/*.js'])
        // eslint() attaches the lint output to the "eslint" property 
        // of the file object so it can be used by other modules. 
        .pipe(eslint({configFile: 'eslint.json'}))
        // eslint.format() outputs the lint results to the console. 
        // Alternatively use eslint.formatEach() (see Docs). 
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on 
        // lint error, return the stream and pipe to failAfterError last. 
        .pipe(eslint.failAfterError());
});
 


gulp.task('jade', () => {
  gulp.src(srcFolder + 'jade/page/*.jade')
    .pipe(jade({}))
    .pipe(gulp.dest(distFolder));
})


gulp.task('sprite', function () {
  var spriteData = 
  gulp.src(srcFolder + 'images/sprite/*.*')
    .pipe(spritesmith({
      imgName: 'sprite.png',
      cssName: 'sprite.scss',
      cssFormat: 'scss',
      imgPath: '../images/sprite/sprite.png',
      cssVarMap: function(sprite) {
        sprite.name = 'sprite-' + sprite.name
      }
    }));

  spriteData.img.pipe(gulp.dest('dist/images/sprite/'));
  spriteData.css.pipe(gulp.dest(srcFolder + 'css/sprite/'));
});


// gulp.task('js', function(){
//   return gulp.src(['src/jscript/libs/jquery-1.12.4.min.js', 'src/jscript/libs/*.js', 'src/jscript/*.js'])
//     .pipe(concat('concat.js'))
//     .pipe(sourcemaps.write('./'))
//     .pipe(gulp.dest(distFolder + 'jscript'));
// });


// gulp.task('imageopt', function(cb) {
//   gulp.src(['src/**/*.png','src/**/*.jpg','src/**/*.gif','src/**/*.jpeg']).pipe(imageop({
//       optimizationLevel: 5,
//       progressive: true,
//       interlaced: true
//   })).pipe(gulp.dest(distFolder + '')).on('end', cb).on('error', cb);
// });

gulp.task('imageopt', () =>
  gulp.src(srcFolder + 'images/**/*.*')
    .pipe(imagemin())
    .pipe(gulp.dest(distFolder + 'images'))
);


gulp.task('fileinclude', function() {
  gulp.src([srcFolder + 'html/*.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: srcFolder + 'html/'
    }))
    .pipe(gulp.dest(distFolder + ''))
    .pipe(livereload());
});


gulp.task('lr-server', function() {  
  server.listen(35728, function(err) {
    if(err) return console.log(err);
  });
});


gulp.task('sass', function() {
  return sass(srcFolder + 'scss/**/*.scss', { style: 'expanded' })
    .pipe(autoprefixer({ browsers: ['> 0.1%', 'IE 7'], cascade: false }))
    .pipe(gulp.dest(distFolder + 'css'))
    .pipe(livereload());
});

gulp.task('scss-lint', function() {
  return gulp.src(srcFolder + 'scss/**/*.scss')
    .pipe(scsslint());
});


gulp.task('watch', function() {
  livereload.listen();
  gulp.watch(srcFolder + 'scss/**/*.scss', ['sass' , 'scss-lint']);
  gulp.watch(srcFolder + '**/*.html', ['fileinclude']);
  gulp.watch(srcFolder + 'images/**/*', ['imageopt']);
  gulp.watch(srcFolder + 'images/sprite/*.png', ['sprite']);
  gulp.watch(srcFolder + 'js/**/*.js', ['js', 'es-lint']);
  gulp.watch(srcFolder + 'jade/**/*.jade', ['jade']);
});


gulp.task('clean', function() {
  return true;
  //return del([distFolder + 'css', distFolder + 'jscript', distFolder + 'img']);
});


gulp.task('default', ['clean'], function() {
  gulp.start('lr-server', 'sass', 'scss-lint', 'watch', 'fileinclude', 'jade', 'js', 'es-lint');
});