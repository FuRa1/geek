describe('testApp', function () {

    var httpBackend, loginFactory, scope, $controller, createController, state, serverUrl;

    serverUrl = 'https://93.183.203.13:10443/login'

    beforeEach(module('testApp'));

    beforeEach(module(function($urlRouterProvider) {
        $urlRouterProvider.deferIntercept();
    }));

    beforeEach(inject(function ($injector) {
        q = $injector.get('$q');
        httpBackend = $injector.get('$httpBackend');
        loginFactory = $injector.get('Login');
        $controller = $injector.get('$controller');
        scope = $injector.get('$rootScope').$new();
        state = $injector.get('$state');

        createController = function() {
                return $controller('loginCtrl');
            };

    }));

    afterEach(function() {
        console.log("-----------------------------------------------");
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should return Auth:"Logged" response, and get template for /success/ state', function () {


        var controller = createController();

        httpBackend.expectPOST(serverUrl).respond(200, {Auth:'Logged'});

        controller.login = 'CorrectLogin';
        controller.password = 'CorrectLogin';

        (controller.submit)();

        httpBackend.expectGET('./partials/title-success.html').respond(200, "State was changed");

        httpBackend.flush();

    });

    it('should return Auth:"HOTP required" response, and get template for /hotp/ state', function () {


        var controller = createController();

        httpBackend.expectPOST(serverUrl).respond(200, {Auth:'HOTP required'});

        controller.login = 'CorrectLogin';
        controller.password = 'CorrectPassword';

        (controller.submit)();

        httpBackend.expectGET('./partials/title-login.html').respond(200);
        httpBackend.expectGET('./partials/hotp.html').respond(200);

        httpBackend.flush();

    });

    it('should return Auth:"HOTP wrong code" response, and mark input as "Error" class (Denied to be True)', function () {


        var controller = createController();

        httpBackend.expectPOST(serverUrl).respond(200, {Auth:'HOTP wrong code'});

        controller.login = 'CorrectLogin';
        controller.password = 'CorrectPassword';
        controller.hotp = 'WrongCode';


        controller.submit().then(function(data){
            expect(controller.denied).toBe(true);

        });

        httpBackend.flush();

    });

    it('should return Auth:"Banned" response, then disable button for Time:xxx (isBanned Denied to be true)', function () {


        var controller = createController();

        httpBackend.expectPOST(serverUrl).respond(200, {Auth:'Banned',Time:'10'});

        controller.login = 'SomeLogin';
        controller.password = 'SomePassword';


        controller.submit().then(function(data){
            expect(controller.isBanned).toBe(true);

        });

        httpBackend.flush();

    });
});