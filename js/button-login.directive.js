(function () {
    'use strict';
    angular
        .module('testApp')
        .directive('loadingButton', loadingButton);

    function loadingButton() {

        return {
            restrict: 'E',
            replace: true,
            scope: {
                buttonText: '=buttonText',
                isBanned: '=',
                isLoading: '='
            },
            templateUrl: './partials/button-login-directive.html',
            link: function(scope, element, attrs, controller) {
                scope.$watch('isLoading', updateLoading);
                scope.$watch('isBanned', updateBanned);

                function updateLoading(isLoading) {
                    console.log('isLoading', isLoading);
                }

                function updateBanned(isBanned) {
                    console.log('isBanned', isBanned);
                }
            }
        }
    }
})();

