(function () {
    'use strict';
    angular
        .module('testApp')
        .factory('Login', Login);

    Login.$inject = ['$http'];

    function Login($http) {

        return function http(userLogin, userPassword, hotpPassword) {

            var url = 'https://93.183.203.13:10443/login';

            // Create a new request object for each call
            var reqObj = {};

            if(userLogin && userPassword){              //check value from input fields, to work from different states,
                reqObj.Login = userLogin;               //allow to not lose login && password, and save them in factory
                reqObj.Password = userPassword;         //when state /hotp
            }

            if(hotpPassword){
                reqObj.Hotp = hotpPassword;             //check hotp pass value, for /authentication state
            }                                           //allow to not send Hotp:'undefined' in first request
            
            console.log('Request object:', reqObj);

            var parameter = JSON.stringify(reqObj);     //restrict request data to JSON format
            console.log('Request parameter:', parameter);
            
            // Set proper headers for the request
            var req = {
                method: 'POST',
                url: url,
                dataType: "json",
                data: parameter,
                headers:{
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            return $http(req
            ).then(function successCallback(response) {
                console.log('Success response:', response.data);
                return response;
            }, function errorCallback(response) {
                console.log('Error response:', response);
                // Return a rejected promise with the error data for proper handling
                return Promise.reject(response);
            });
        }

    }

})
();