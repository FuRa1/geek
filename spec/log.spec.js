describe('testApp/authentication', function () {

    var $httpBackend, createController, authRequestHandler, LoginFactory;


    beforeEach(module('testApp'));

    beforeEach(inject(function ($injector) {

        $httpBackend = $injector.get('$httpBackend');

        LoginFactory = $injector.get('Login');

        var $controller = $injector.get('$controller');

        authRequestHandler = $httpBackend.when('POST', 'https://93.183.203.13:10443/login')
            .respond(200, {'data':{'Auth':'Denied'}});

        createController = function () {
            return $controller('loginCtrl', {'Login': LoginFactory});
        };
    }));

    it('should return "Auth:denied" response ', function () {


        var login = 'WrongLogin';
        var password = 'WrongPassword';
        var data;

        $httpBackend.expectPOST('https://93.183.203.13:10443/login').respond(200, {Auth:'Denied'});

        LoginFactory(login,password).then(function(res){
            data = res.data;
            expect(data.Auth).toBe('Denied');

        });

        $httpBackend.flush();


    });

});