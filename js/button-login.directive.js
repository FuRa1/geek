(function () {
    'use strict';
    angular
        .module('testApp')
        .directive('loggerButton', loggerButton)
        .directive('loginButton', function () {
            return function(scope, element, attrs) {
                scope.$watch(attrs.loginButton,function(){
                    var phase = scope.buttonContent;
                    element.text(attrs[phase]);
                });
            }
        })
        .directive('logButton', logButton);

    function logButton(){
        var directive = {
            restrict: 'EA',
            link: linkFunc,
            controllerAs: 'bt'
        };

        return directive;
    }

    function linkFunc(scope, element, attrs) {
        scope.$watch(attrs.logButton,function(){
            var phase = scope.buttonContent;
            element.text(attrs[phase]);
        });
    }

    function loggerButton() {

        var directive = {
            restrict: 'EA',
            templateUrl: './partials/button-login-directive.html',
            link: linkFunc2,
            controller: 'loginCtrl',
            controllerAs: 'bt'
        };

        return directive;
    }

    function linkFunc2(scope, element, attrs) {
        /*  element.bind('click', function(event) {
         var message = attrs.confirmNgClick;
         if (message && !confirm(message)) {
         event.stopImmediatePropagation();
         event.preventDefault();
         }
         }) */
    }

})();

