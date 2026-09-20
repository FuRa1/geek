(function () {
    angular
        .module('testAppControllers', [])
        .controller('loginCtrl', loginCtrl);


    loginCtrl.$inject = ['Login', '$state', '$timeout'];   //inject Login Factory and state route.

    function loginCtrl(login, state, timeout) {


        var vm = this;

        vm.submit = submit;         //form ng-submit call submit() function when button type submit clicked.


        var callbacksMethods = {   //Obj methods depending on response data.

            logged: logged,
            banned: banned,
            denied: denied,
            hotpRequired: hotpRequired,
            hotpWrongCode: hotpWrong

        };


        function submit() {

            var log = vm.login;
            var pass = vm.password;
            var htop = vm.hotp;

            vm.isLoading = true;                    //when submit starts, push true into button directive isLoading attr,
                                                    // that will change button text for loading state

            return login(log, pass, htop)                  //start $http request form Factory Login.
                .then(function (res) {

                    vm.isLoading = false;           //push false into button directive isLoading, when response return.

                    var data = res.data;


                    var responseType = _.camelCase(data.Auth);   //restrict Auth: 'value' to camelCase for  callbacksMethods Object


                    console.log('Response type:', responseType);

                    // Handle different authentication responses
                    if (responseType === 'logged') {
                        // Successful login - transition to success state
                        callbacksMethods[responseType](data);
                    } else if (responseType === 'banned') {
                        // Account banned - show ban message and disable login for specified time
                        callbacksMethods[responseType](data);
                    } else if (responseType === 'denied') {
                        // Invalid credentials - mark fields as invalid
                        callbacksMethods[responseType](data);
                    } else if (responseType === 'hotpRequired') {
                        // HOTP required - transition to HOTP state
                        callbacksMethods[responseType](data);
                    } else if (responseType === 'hotpWrongCode') {
                        // Wrong HOTP code - mark field as invalid
                        callbacksMethods[responseType](data);
                    } else {
                        // Unknown response - log error
                        console.log('Unknown response type:', responseType);
                        vm.isLoading = false;
                    }

                })
                .catch(function (e) {
                    console.log('HTTP Error:', e);
                    vm.isLoading = false;
                })
        }

        function logged(data) {
            console.log('Success state');
            // Successful login - transition to success state
            state.transitionTo('success', {});   // if response Auth:'Logged', go to state Success.
        }

        function banned(data) {
            vm.isBanned = true;         //if response Auth:'Banned', disable login button for time in response Time:'sec'.
            console.log('Banned for ' + data.Time + ' sec');
            var time = parseFloat(data.Time) * 1000;
            timeout(function () {
                vm.isBanned = false;
            }, time)
        }

        function denied() {
            console.log('Denied');
            vm.denied = true;                    //if response Auth:'Denied', mark login field to red, util user type new data.
        }

        function hotpRequired() {
            console.log('hotpRequired state');
            // HOTP required - transition to HOTP state
            state.transitionTo('hotp', {});     //if response Auth:'HOTP required', go to state hotp.
        }

        function hotpWrong() {
            console.log('hotpWrong');
            vm.denied = true;                   //if response Auth:'HOTP wrong code', mark hotp pass field to red, util user type new data.
        }
    }

})();
