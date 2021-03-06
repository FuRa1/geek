(function () {
    'use strict';
    angular
        .module('testApp', [
            'ui.router',
            'testAppControllers'
        ])
        .config(config);


    function config($stateProvider, $urlRouterProvider) {

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

            })
            .state('hotp', {
                url: '/hotp',
                views: {
                    'title': {templateUrl: './partials/title-login.html'},
                    'form': {
                        templateUrl: './partials/hotp.html',
                        controller: 'loginCtrl',
                        controllerAs: 'ht'
                    }
                }

            })
            .state('success', {
                url: '/success',
                views: {
                    'title': {templateUrl: './partials/title-success.html'}
                }

            });
        $urlRouterProvider.otherwise('/authentication');
    }
})();



