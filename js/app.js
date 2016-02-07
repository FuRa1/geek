(function () {
    'use strict';
    angular.module('testApp', [
        'ui.router',
        'testAppControllers'
    ])
        .config(function ($httpProvider) {
            delete $httpProvider.defaults.headers.common['X-Requested-With'];
        })
        .
        config(function ($stateProvider, $urlRouterProvider) {

            $stateProvider
                .state('authentication', {
                    url: "/authentication",
                    templateUrl: "./partials/authentication.html",
                    controller: 'loginCtrl'
                })
                .state('success', {
                    url: "/success",
                    templateUrl: "./partials/success.html"

                })

                .state('HOTP', {
                    url: "/HOTP",
                    templateUrl: "./partials/HOTP.html",
                    controller: 'hotpCtrl'
                });

            $urlRouterProvider.otherwise('/authentication');
        });
})();



