(function () {
    angular
        .module('testAppControllers', [])
        .controller('loginCtrl', loginCtrl)
        .controller('hotpCtrl', hotpCtrl);


    loginCtrl.$inject = ['logger','$state'];
    loginCtrl.$inject = ['logger','$state'];


    function loginCtrl(logger, state) {

        var vm = this;


        vm.submit = submit;
        vm.banned = false;

        (function(){
            vm.buttonContent = 'Login';
        })();


        function submit() {

            var log = vm.login;
            var pass = vm.password;

            if(!log || !pass){
                vm.denied = true;
                return
            }

            vm.buttonContent = 'Loading';

            logger.http(log, pass, false)
                .then(function (res) {

                    vm.buttonContent = 'Login';

                    var data = res.data;

                    console.log(data.Auth);
                    if (data.Auth === "Denied") {

                        vm.denied = true;

                        state.transitionTo('hotp', {});

                    }
                    if (data.Auth === "Logged") {

                        state.transitionTo('success', {});


                    }
                    if (data.Auth === "HOTP required") {

                        state.transitionTo('hotp', {});

                    }
                    if (data.Auth === "Banned") {
                        vm.banned = true;
                        var time = parseFloat(data.Time) * 1000;
                        setTimeout(function () {
                            vm.banned = false;
                        }, time)
                    }

                }).catch(function (e) {
                    console.log(e);
                })


        }

    }

    function hotpCtrl(logger){
        var vm = this;


        vm.submit = submit;
        vm.banned = false;

        (function(){
            vm.buttonContent = 'Hotp';
        })();

        function submit() {

            var hotp = vm.hotp ? vm.hotp : false;

            vm.buttonContent = 'Loading';

            logger.http(false, false, hotp)
                .then(function (res) {
                    var data = res.data;

                    vm.buttonContent = 'Hotp';

                    if (data.Auth === "HOTP wrong code") {

                        vm.denied = true;
                    }

                    if (data.Auth === "Logged") {

                        state.transitionTo('success', {});

                    }

                    if (data.Auth === "Banned") {
                        vm.banned = true;
                        var time = parseFloat(data.Time) * 1000;
                        setTimeout(function () {
                            vm.banned = false;
                        }, time)
                    }

                }).catch(function (e) {
                    console.log(e);
                })


        }

    }

})();
