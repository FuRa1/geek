(function () {
    angular
        .module('testAppControllers', [])
        .controller('loginCtrl', loginCtrl);


    loginCtrl.$inject = ['Login','$state'];   //inject Login Factory and state route.


    function loginCtrl(Login, state) {


        var vm = this;

        vm.submit = submit;         //form ng-submit call submit() function when button type submit clicked.


        callbacksMethods={                           //Obj methods depending on response data.
            Logged: function(){
                state.transitionTo('success', {});   // if response Auth:'Logged', go to state Success.
            },
            Banned: function (data) {                //if response Auth:'Banned', disable login button for time in response Time:'sec'.
                vm.isBanned = true;
                var time = parseFloat(data.Time) * 1000;
                setTimeout(function () {
                    vm.isBanned = false;
                }, time)
            },
            Denied: function () {
                vm.denied = true;                    //if response Auth:'Denied', mark login field to red, util user type new data.


            },
            HotpRequired: function () {
                state.transitionTo('hotp', {});     //if response Auth:'HOTP required', go to state hotp.
            },
            HotpWrongCode: function(){
                vm.denied = true;                   //if response Auth:'HOTP wrong code', mark hotp pass field to red, util user type new data.
            }


        };



        function submit() {

            var log = vm.login;
            var pass = vm.password;
            var htop = vm.hotp;

            vm.isLoading = true;                    //when submit starts, push true into button directive isLoading attr,
                                                    // that will change button text for loading state

            Login(log, pass, htop)                  //start $http request form Factory Login.
                .then(function (res) {

                    vm.isLoading = false;           //push false into button directive isLoading, when response return.

                    var data = res.data;
                    var responseType = _.camelCase(data.Auth);   //restrict Auth: 'value' to CamelCase for  callbacksMethods Object

                    console.log(responseType);

                    callbacksMethods[responseType](data);       //run callbacksMethods method depending on response Auth:'value'

                })
                .catch(function (e) {
                    console.log(e);
                })
        }


    }

})();
