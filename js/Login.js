(function () {
    'use strict';
    angular
        .module('testApp')
        .factory('Login', Login);

    Login.$inject = ['$http'];

    function Login($http) {

        var reqObj ={};

         return function http(userLogin, userPassword, hotpPassword) {

            var url = 'https://93.183.203.13:10443/login';

            if(userLogin && userPassword){              //check value from input fields, to work from different states,
                reqObj.Login = userLogin;               //allow to not lose login && password, and save them in factory
                reqObj.Password = userPassword;         //when state /hotp
            }

            if(hotpPassword){
                reqObj.Hotp = hotpPassword;             //check hotp pass value, for /authentication state
            }                                           //allow to not send Hotp:'undefined' in first request
            console.log(reqObj);

            var parameter = JSON.stringify(reqObj);     //restrict request data to JSON format
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