describe('testApp/authentication', function () {

    var $httpBackend, createController, authRequestHandler, LoginFactory;

    var url = 'https://93.183.203.13:10443/login';

    var parameter = JSON.stringify({Login: 'SomeLogin', Password: 'SomePassword'});
    var req = {
        method: 'POST',
        url: url,
        dataType: "json",
        data: parameter,
        headers: {
            'Content-Type': JSON,
            'Access-Control-Allow-Origin': "*"
        }
    };

    beforeEach(module('testApp'));

    beforeEach(inject(function ($injector) {

        $httpBackend = $injector.get('$httpBackend');

        LoginFactory = $injector.get('Login');

        var $controller = $injector.get('$controller');

        authRequestHandler = $httpBackend.when('POST', url)
            .respond(200, {'data':{'Auth':'Denied'}});

        createController = function () {
            return $controller('loginCtrl', {'Login': LoginFactory});
        };
    }));

    it('should return "Auth:dined" response ', function () {

        $httpBackend.expectPOST(req).respond();
        var data = respond.data;

        expect(data[Auth]).toBe("Denied");
    });

});