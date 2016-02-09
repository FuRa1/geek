(function () {
    angular
        .module('testAppControllers', [])
        .controller('loginCtrl', loginCtrl)
        .controller('hotpCtrl', hotpCtrl);


    loginCtrl.$inject = ['services'];
    hotpCtrl.$inject = ['services'];

    function loginCtrl (services) {

        this.submit = submit;

        function submit() {
            services.httpPostRequest(this.login, this.password)
                .then(function (res) {
                    var data = res.data;
                    if (data.Auth === "Denied") {
                        this.denied = true;
                    }
                    if (data.Auth === "Logged") {
                        document.location.href = '#/success';
                    }

                }).catch(function (e) {
                    console.log(e);
                })


        }

    }

    function hotpCtrl(services) {

    }

})();
