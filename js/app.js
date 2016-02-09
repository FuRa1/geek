(function () {
    'use strict';
    angular.module('testApp', [
        'ui.router',
        'testAppControllers',
        'ui.bootstrap'
    ])
        .config(function ($httpProvider) {
            delete $httpProvider.defaults.headers.common['X-Requested-With'];
        })
        .
        config(function ($stateProvider, $urlRouterProvider) {

            $stateProvider
                .state('authentication', {
                    url: '/authentication',
                    views: {
                            'title': {templateUrl: './partials/title-login.html'},
                            'form': {
                                templateUrl: './partials/authentication.html',
                                controller: 'loginCtrl',
                                controllerAs: 'lg'
                            }
                    }

                });
                /*
                .state('action', {
                    url: "/success",
                    templateUrl: "./partials/success.html"

                })

                .state('HOTP', {
                    url: "/HOTP",
                    templateUrl: "./partials/HOTP.html",
                    controller: 'hotpCtrl'
                });
*/
            $urlRouterProvider.otherwise('/authentication');
        });
})();



