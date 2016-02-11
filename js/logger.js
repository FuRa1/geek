(function () {
    'use strict';
    angular
        .module('testApp')
        .factory('logger', logger);

    logger.$inject = ['$http', '$resource', '$stateParams'];

    function logger($http, $resource, $stateParams) {

        var reqObj ={};

        var service = {
            http: http
        };

        return service;

        function http(userLogin, userPassword, hotpPassword) {

            var url = 'https://93.183.203.13:10443/login';

            if(!!userLogin && !!userPassword){
                reqObj.Login = userLogin;
                reqObj.Password = userPassword
            }

            if(!!hotpPassword){
                reqObj.Hotp = hotpPassword;
            }
            console.log(reqObj);
            var parameter = JSON.stringify(reqObj);
            console.log(parameter);
            var req = {
                method: 'POST',
                url: url,
                dataType: "json",
                data: parameter,
                headers:{
                    'Content-Type': JSON,
                    'Access-Control-Allow-Origin': "*"
                }
            };

            return $http(req
            ).then(function successCallback(response) {
                return response;
            }, function errorCallback(response) {
                console.log(response);
            });
        }

    }

})
();