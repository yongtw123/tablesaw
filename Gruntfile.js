'use strict';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		// Metadata.
		pkg: grunt.file.readJSON('package.json'),
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.company %>;' +
			' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
		// Task configuration.
		clean: {
			dependencies: ['dist/dependencies/'],
			//post: ['dist/tmp/', 'dist/**/*.min.*']
			post: ['dist/tmp/']
		},
		copy: {
			jquery: {
				src: 'node_modules/jquery/dist/jquery.js',
				dest: 'dist/dependencies/jquery.js'
			},
			respond: {
				src: 'node_modules/respond.js/dest/respond.src.js',
				dest: 'dist/dependencies/respond.js'
			},
			qunit: {
				files: [{
					expand: true,
					flatten: true,
					src: [ 'node_modules/qunitjs/qunit/*' ],
					dest: 'dist/dependencies/',
					filter: 'isFile'
				}]
			}
		},
		concat: {
			options: {
				banner: '<%= banner %>',
				stripBanners: true
			},
			jsautoinit: {
				src: ['src/tables-init.js'],
				dest: 'dist/<%= pkg.name %>-init.js'
			},
			all: {
				files: {
					//js
					'dist/<%= pkg.name %>.js': [
						'src/tables.js',
						'src/tables.stack.js',
						'src/tables.btnmarkup.js',
						'src/tables.columntoggle.js',
						'src/tables.swipetoggle.js',
						'src/tables.sortable.js',
						'src/tables.minimap.js',
						'src/tables.modeswitch.js'
					],
					//css
					'dist/tmp/<%= pkg.name %>.myth.css': [
						'src/tables.css',
						'src/tables.toolbar.css',
						'src/tables.skin.css',
						'src/tables.stack.css',
						'src/tables.stack-default-breakpoint.css',
						'src/tables.swipetoggle.css',
						'src/tables.columntoggle.css',
						'src/tables.sortable.css',
						'src/tables.minimap.css',
						'src/tables.modeswitch.css'
					]
				}
			},
			stack: {
				files: {
					//js
					'dist/stackonly/<%= pkg.name %>.stackonly.js': [
						'src/tables.js',
						'src/tables.stack.js'
					],
					//css
					'dist/tmp/<%= pkg.name %>.stackonly.myth.css': [
						'src/tables.css',
						'src/tables.stack.css',
						'src/tables.stack-default-breakpoint.css'
					]
				}
			},
			custom: {
				files: {
					//js
					'dist/custom/<%= pkg.name %>.js': [
						'src/tables.js',
						'src/tables.btnmarkup.js',
						'src/tables.columntoggle.js',
						'src/tables.sortable.js',
						'src/tables-init.js'
					],
					//css
					'dist/tmp/<%= pkg.name %>.custom.myth.css': [
						'src/tables.css',
						'src/tables.toolbar.css',
						'src/tables.columntoggle.css',
						'src/tables.sortable.css',
						'src/tables.minimap.css'
					]
				}
			},
			cssbare: {
				src: ['src/*.css', '!src/tables.skin.css'],
				dest: 'dist/tmp/<%= pkg.name %>.bare.myth.css'
			},
			cssstackmixinpre: {
				src: [
					'src/tables.css',
					'src/tables.stack.css'
				],
				dest: 'dist/tmp/<%= pkg.name %>.stackonly.myth.scss'
			},
			cssstackmixinpost: {
				src: [
					'dist/tmp/<%= pkg.name %>.stackonly-sans-mixin.scss',
					'src/tables.stack-mixin.scss'
				],
				dest: 'dist/stackonly/<%= pkg.name %>.stackonly.scss'
			}
		},
		qunit: {
			files: ['test/**/*.html']
		},
		jshint: {
			gruntfile: {
				options: {
					jshintrc: '.jshintrc'
				},
				src: 'Gruntfile.js'
			},
			src: {
				options: {
					jshintrc: 'src/.jshintrc'
				},
				src: ['src/**/*.js']
			},
			test: {
				options: {
					jshintrc: 'test/.jshintrc'
				},
				src: ['test/**/*.js']
			},
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			src: {
				files: ['src', '!src/.jshintrc'],
				tasks: ['src']
			},
			test: {
				files: '<%= jshint.test.src %>',
				tasks: ['jshint:test', 'qunit']
			},
		},
		uglify: {
			all: {
				src: [ 'dist/<%= pkg.name %>.js' ],
				dest: 'dist/<%= pkg.name %>.min.js'
			},
			stack: {
				src: [ 'dist/stackonly/<%= pkg.name %>.stackonly.js' ],
				dest: 'dist/stackonly/<%= pkg.name %>.stackonly.min.js'
			},
			custom: {
				src: [ 'dist/custom/<%= pkg.name %>.js' ],
				dest: 'dist/custom/<%= pkg.name %>.min.js'
			}
		},
		cssmin: {
			all: {
				src: [ 'dist/<%= pkg.name %>.css' ],
				dest: 'dist/<%= pkg.name %>.min.css'
			},
			stack: {
				src: [ 'dist/stackonly/<%= pkg.name %>.stackonly.css' ],
				dest: 'dist/stackonly/<%= pkg.name %>.stackonly.min.css'
			},
			custom: {
				src: [ 'dist/custom/<%= pkg.name %>.css' ],
				dest: 'dist/custom/<%= pkg.name %>.min.css'
			},
			bare: {
				src: [ 'dist/bare/<%= pkg.name %>.bare.css' ],
				dest: 'dist/bare/<%= pkg.name %>.bare.min.css'
			}
		},
		bytesize: {
			all: {
				src: [ '<%= uglify.all.dest %>', '<%= cssmin.all.dest %>' ]
			},
			stack: {
				src: [ '<%= uglify.stack.dest %>', '<%= cssmin.stack.dest %>' ]
			},
			custom: {
				src: [ '<%= uglify.custom.dest %>', '<%= cssmin.custom.dest %>' ]
			},
			bare: {
				src: [ '<%= cssmin.bare.dest %>' ]
			}
		},
		'gh-pages': {
			options: {},
			src: ['dist/**/*', 'demo/**/*', 'test/**/*']
		},
		myth: {
			all: {
				src: [ 'dist/tmp/<%= pkg.name %>.myth.css' ],
				dest: 'dist/<%= pkg.name %>.css'
			},
			stack: {
				files: {
					'dist/stackonly/<%= pkg.name %>.stackonly.css': [ 'dist/tmp/<%= pkg.name %>.stackonly.myth.css' ],
					'dist/tmp/<%= pkg.name %>.stackonly-sans-mixin.scss': '<%= concat.cssstackmixinpre.dest %>'
				}
			},
			custom: {
				src: [ 'dist/tmp/<%= pkg.name %>.custom.myth.css' ],
				dest: 'dist/custom/<%= pkg.name %>.css'
			},
			bare: {
				src: [ 'dist/tmp/<%= pkg.name %>.bare.myth.css' ],
				dest: 'dist/bare/<%= pkg.name %>.bare.css'
			}
		},
        /*
		compress: {
			main: {
				options: {
					archive: 'dist/tablesaw-<%= pkg.version %>.zip',
					mode: 'zip',
					pretty: true
				},
				files: [
					{expand: true, cwd: 'dist/', src: ['*'], dest: 'tablesaw/'},
					{expand: true, cwd: 'dist/', src: ['dependencies/*'], dest: 'tablesaw/'},
					{expand: true, cwd: 'dist/', src: ['stackonly/*'], dest: 'tablesaw/'},
					{expand: true, cwd: 'dist/', src: ['bare/*'], dest: 'tablesaw/'}
				]
			}
		}*/
        serve: {
            options: {
                port: 9002
            }
        }
	});

	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// Private task.
	grunt.registerTask('travis', ['jshint', 'qunit']);
	grunt.registerTask('_clean', ['clean:dependencies', 'copy', 'clean:post']);
	
	// Source build task
	grunt.registerTask('srcall', ['concat:jsautoinit', 'concat:all', 'myth:all', '_clean']);
	grunt.registerTask('srcstack', ['concat:jsautoinit', 'concat:stack', 'concat:cssstackmixinpre', 'myth:stack', 'concat:cssstackmixinpost', '_clean']);
	grunt.registerTask('srccustom', ['concat:custom', 'myth:custom', '_clean']);
	grunt.registerTask('src', ['concat', 'myth', 'concat:cssstackmixinpost', '_clean']);
	
	// Minify
	grunt.registerTask('minall', ['uglify:all', 'cssmin:all', 'bytesize:all', 'clean:post']);
	grunt.registerTask('minstack', ['uglify:stack', 'cssmin:stack', 'bytesize:stack', 'clean:post']);
	grunt.registerTask('mincustom', ['uglify:custom', 'cssmin:custom', 'bytesize:custom', 'clean:post']);
	grunt.registerTask('min', ['uglify', 'cssmin', 'bytesize', 'clean:post']);

	// Dist, partial build does not do testing
	grunt.registerTask('all', ['jshint', 'srcall', 'qunit', 'minall']);
	grunt.registerTask('stack', ['jshint', 'srcstack', 'minstack']);
	grunt.registerTask('custom', ['jshint', 'srccustom', 'mincustom']);
	grunt.registerTask('default', ['jshint', 'src', 'qunit', 'min']);

	// Deploy
	grunt.registerTask('deploy', ['default', 'gh-pages']);

};
