module.exports = function(config){
    config.set({

        basePath : './',

        files : [
            './bower_components/angular/angular.js',
            './bower_components/angular-mocks/angular-mocks.js',
            './bower_components/jquery/dist/jquery.min.js',
            './bower_components/angular-ui-router/release/angular-ui-router.min.js',
            './bower_components/lodash/dist/lodash.min.js',
            './js/**/*.js',
            './spec/login.spec.js'
        ],

        autoWatch : true,

        frameworks: ['jasmine', 'jasmine-matchers'],

        browsers : ['Chrome'],

        plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-jasmine-matchers',
            'karma-junit-reporter'
        ],

        angularFilesort: {
            whitelist: [
                './app/js/**/*.js'
            ]
        },

        singleRun: true,

        junitReporter : {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        }

    });
};
