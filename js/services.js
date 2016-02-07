(function () {
    'use strict';
    angular
        .module('testApp')
        .factory('services', services);

    services.$inject = ['$http', '$stateParams'];

    function services($http, $stateParams) {

        var services = {
            httpPostRequest: httpPostRequest
        };

        return services;

        function httpPostRequest(userLogin, userPassword) {
            var url = 'https://93.183.203.13:10443/login';
            var parameter = JSON.stringify({Login: userLogin, Password: userPassword});
            return $http({
                method: 'POST',
                url: url,
                dataType: "json",
                headers: {
                    'Content-Type': "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                data: parameter
            }).then(function successCallback(response) {
                console.log(response);
                // this callback will be called asynchronously
                // when the response is available
            }, function errorCallback(response) {
                console.log(response);
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }

        /*
         function login(username, password) {
         return fetch(‘/login’, {
         method: ‘post’,
         body: JSON.stringify({
         username: username
         password: password
         })
         }).then(response => response.json());
         }

         function getPosts(token) {
         return fetch(‘/posts’, {
         headers: new Headers({
         ‘X-Security-Token’: token
         })
         }).then(response => response.json());
         }

         const username = ‘’;
         const password = ‘’;

         login(username, password)
         .then(result => getPosts(result.token))
         .then(posts => {
         console.log(posts);
         })
         .catch(err => {
         console.log(err);
         });


         */
    }

})
();