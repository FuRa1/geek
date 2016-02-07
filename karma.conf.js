module.exports = function(config){
    config.set({

        basePath : './',

        files : [
            './bower_components/angular/angular.js',
            './bower_components/angular-mocks/angular-mocks.js',
            './js/**/*.js',
            './spec/parser.spec.js'
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
