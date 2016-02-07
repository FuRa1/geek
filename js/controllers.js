(function () {
    angular
        .module('testAppControllers', [])
        .controller('loginCtrl', loginCtrl)
        .controller('hotpCtrl', hotpCtrl);


    loginCtrl.$inject = ['$scope', 'services'];
    hotpCtrl.$inject = ['$scope', 'services'];

    function loginCtrl($scope, services) {

        $scope.submit = submit;

        function submit(){
            console.log($scope.login, $scope.password);
            services.httpPostRequest($scope.login, $scope.password)
        }

    }

    function hotpCtrl($scope, services) {

    }

})();
